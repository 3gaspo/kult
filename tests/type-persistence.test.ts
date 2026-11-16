import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LocalDataProvider } from '../src/providers/localProvider';
import type { ContentItem } from '../src/types';

test('deleting all default types persists across reconnection and preserves content', async () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } });
  const provider = new LocalDataProvider();
  const defaults = await provider.getContentTypes('test');
  assert.equal(defaults.length, 4);
  await provider.addContentItem('test', { id: 'book-test', title: 'Keep this book', typeId: 'book', typeLabel: 'Book', status: 'to_complete' } as ContentItem);
  for (const type of defaults) await provider.deleteContentType('test', type.id, '');
  assert.deepEqual(await new LocalDataProvider().getContentTypes('test'), []);
  const [item] = await provider.getContentItems('test');
  assert.equal(item.title, 'Keep this book');
  assert.equal(item.typeId, '');
  assert.equal(item.typeLabel, 'Uncategorized');
  await provider.resetAllData('test');
  assert.equal((await provider.getContentTypes('test')).length, 4);
});
