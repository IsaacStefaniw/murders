import { describeUpdate, type UpdateInfo } from '@/lib/updates';

const embedded: UpdateInfo = {
  channel: 'preview',
  runtimeVersion: '3306a410',
  updateId: null,
  createdAt: null,
  isEmbedded: true,
};

describe('describeUpdate', () => {
  it('says updates are unavailable when the module is not there', () => {
    // A web build or a simulator — not a fault, and not worth a scary line.
    expect(describeUpdate(null)).toMatch(/not available/i);
  });

  it('names the embedded bundle rather than pretending an update landed', () => {
    expect(describeUpdate(embedded)).toMatch(/shipped with this build/i);
  });

  it('falls back to the embedded wording when a date is missing', () => {
    // updateId without createdAt should not render "Updated Invalid Date".
    const half: UpdateInfo = { ...embedded, updateId: 'abc', isEmbedded: false };
    expect(describeUpdate(half)).toMatch(/shipped with this build/i);
  });

  it('reports when the running update was published', () => {
    const applied: UpdateInfo = {
      ...embedded,
      updateId: 'abc',
      createdAt: new Date('2026-09-01T04:30:00Z'),
      isEmbedded: false,
    };
    expect(describeUpdate(applied)).toMatch(/^Updated /);
  });
});
