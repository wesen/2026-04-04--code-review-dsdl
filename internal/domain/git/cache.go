package git

import (
	"context"
	"sync"
	"time"
)

// cacheEntry holds a cached result with its expiry time.
type cacheEntry struct {
	value    interface{}
	expiry   time.Time
	validAt  time.Time // time when entry was written (for refresh)
}

// RepoServiceWithCache wraps a RepoService with an in-memory TTL cache.
type RepoServiceWithCache struct {
	wrapped RepoService
	ttl     time.Duration
	mu      sync.RWMutex
	// keyed by cacheKey (repoPath|action|ref|path|start|end)
	entries map[string]cacheEntry
}

// NewCachedRepoService returns a RepoService that caches results for ttl.
func NewCachedRepoService(wrapped RepoService, ttl time.Duration) *RepoServiceWithCache {
	c := &RepoServiceWithCache{
		wrapped: wrapped,
		ttl:     ttl,
		entries: make(map[string]cacheEntry),
	}
	// Start background eviction.
	go c.evictLoop()
	return c
}

// cacheKey builds a unique cache key for a read operation.
func cacheKey(repoPath, action, ref, path string, start, end int) string {
	return repoPath + "|" + action + "|" + ref + "|" + path + "|" +
		itoa(start) + "|" + itoa(end)
}

// itoa converts an int to a string without importing strconv.
func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	var b [20]byte
	pos := len(b)
	neg := false
	if i < 0 {
		neg = true
		i = -i
	}
	for i > 0 {
		pos--
		b[pos] = byte('0' + i%10)
		i /= 10
	}
	if neg {
		pos--
		b[pos] = '-'
	}
	return string(b[pos:])
}

func (c *RepoServiceWithCache) get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.entries[key]
	if !ok {
		return nil, false
	}
	if time.Now().After(entry.expiry) {
		return nil, false
	}
	return entry.value, true
}

func (c *RepoServiceWithCache) set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[key] = cacheEntry{
		value:   value,
		expiry:  time.Now().Add(c.ttl),
		validAt: time.Now(),
	}
}

func (c *RepoServiceWithCache) evictLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		c.evictExpired()
	}
}

func (c *RepoServiceWithCache) evictExpired() {
	c.mu.Lock()
	defer c.mu.Unlock()
	now := time.Now()
	for k, v := range c.entries {
		if now.After(v.expiry) {
			delete(c.entries, k)
		}
	}
}

// ReadFileLines implements RepoService.
func (c *RepoServiceWithCache) ReadFileLines(ctx context.Context, repoPath, ref, path string, start, end int) ([]string, error) {
	key := cacheKey(repoPath, "ReadFileLines", ref, path, start, end)
	if v, ok := c.get(key); ok {
		return v.([]string), nil
	}
	lines, err := c.wrapped.ReadFileLines(ctx, repoPath, ref, path, start, end)
	if err == nil {
		c.set(key, lines)
	}
	return lines, err
}

// GetDiff implements RepoService.
func (c *RepoServiceWithCache) GetDiff(ctx context.Context, repoPath, fromRef, toRef, path string) (string, error) {
	key := cacheKey(repoPath, "GetDiff", fromRef+"|"+toRef, path, 0, 0)
	if v, ok := c.get(key); ok {
		return v.(string), nil
	}
	diff, err := c.wrapped.GetDiff(ctx, repoPath, fromRef, toRef, path)
	if err == nil {
		c.set(key, diff)
	}
	return diff, err
}

// ListRefs implements RepoService.
func (c *RepoServiceWithCache) ListRefs(ctx context.Context, repoPath string) ([]RefInfo, error) {
	key := repoPath + "|ListRefs"
	if v, ok := c.get(key); ok {
		return v.([]RefInfo), nil
	}
	refs, err := c.wrapped.ListRefs(ctx, repoPath)
	if err == nil {
		c.set(key, refs)
	}
	return refs, err
}

// ResolveRef implements RepoService.
func (c *RepoServiceWithCache) ResolveRef(ctx context.Context, repoPath, refName string) (string, error) {
	return c.wrapped.ResolveRef(ctx, repoPath, refName)
}

// Verify interface is satisfied.
var _ RepoService = (*RepoServiceWithCache)(nil)
