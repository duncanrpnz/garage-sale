'use client';

import { useMemo, useState } from 'react';

function createMergedItem(items, sourceIds) {
  const selected = items.filter((item) => sourceIds.includes(item.id));
  if (selected.length < 2) return null;

  const mergedImages = selected.flatMap((item) => item.images);
  const mergedTitles = selected.map((item) => item.title).filter(Boolean);
  const mergedDescriptions = selected.map((item) => item.description).filter(Boolean);
  const mergedNotes = selected.map((item) => item.notes).filter(Boolean);
  const prices = selected.map((item) => Number(item.price)).filter((value) => Number.isFinite(value));

  const mergedId = `merged-${Date.now()}`;
  return {
    id: mergedId,
    images: mergedImages,
    title: mergedTitles[0] || 'Merged listing',
    price: prices.length ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length) : 0,
    description: mergedDescriptions.join('\n\n---\n\n'),
    notes: mergedNotes.join('\n')
  };
}

export default function HomePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [selectedForMerge, setSelectedForMerge] = useState([]);

  const previews = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);

  async function handleAnalyze() {
    if (!files.length) return;
    setLoading(true);
    setError('');
    setItems([]);
    setSelectedForMerge([]);

    const formData = new FormData();
    for (const file of files) formData.append('photos', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to analyze uploads.');
        return;
      }

      setItems(data.items || []);
    } catch {
      setError('Unexpected error while analyzing photos.');
    } finally {
      setLoading(false);
    }
  }

  function updateItem(id, patch) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function toggleMergeSelection(id) {
    setSelectedForMerge((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  }

  function handleMergeSelected() {
    const merged = createMergedItem(items, selectedForMerge);
    if (!merged) return;

    setItems((current) => {
      const survivors = current.filter((item) => !selectedForMerge.includes(item.id));
      return [merged, ...survivors];
    });

    setSelectedForMerge([]);
  }

  return (
    <main className="shell">
      <section className="hero card">
        <div className="eyebrow">AI Marketplace Copilot</div>
        <h1>Garage Sale</h1>
        <p>
          Upload a batch of photos, auto-group duplicate shots of the same item, and generate listing drafts with editable
          title, price, and description.
        </p>

        <div className="upload-box">
          <div className="upload-header">
            <h2>1) Upload Photos</h2>
            <span className="muted">JPG/PNG · Multi-select supported</span>
          </div>

          <input
            className="file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
          />

          <div className="muted">{files.length ? `${files.length} file(s) selected` : 'No photos selected yet.'}</div>

          {previews.length > 0 && (
            <div className="preview-row">
              {previews.map((preview) => (
                <img key={preview.url} src={preview.url} alt={preview.name} />
              ))}
            </div>
          )}

          <button className="primary" disabled={loading || !files.length} onClick={handleAnalyze}>
            {loading ? 'Analyzing photos…' : 'Generate listings'}
          </button>

          {error && <div className="error-text">{error}</div>}
        </div>
      </section>

      {items.length > 0 && (
        <section className="card grid">
          <div className="merge-toolbar">
            <div>
              <h2>2) Review & Merge Groups</h2>
              <p className="muted">If the AI split one item into separate groups, select those groups and merge them.</p>
            </div>
            <button className="secondary" disabled={selectedForMerge.length < 2} onClick={handleMergeSelected}>
              Merge selected ({selectedForMerge.length})
            </button>
          </div>

          <div className="item-grid">
            {items.map((item) => (
              <article className="card listing listing-card" key={item.id}>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={selectedForMerge.includes(item.id)}
                    onChange={() => toggleMergeSelection(item.id)}
                  />
                  <span>Select this group for merge</span>
                </label>

                <div className="preview-row">
                  {item.images.map((src, index) => (
                    <img key={`${item.id}-${index}`} src={src} alt={`Item ${item.id} image ${index + 1}`} />
                  ))}
                </div>

                <label>
                  Title
                  <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} />
                </label>

                <label>
                  Price (USD)
                  <input
                    type="number"
                    value={item.price}
                    onChange={(event) => updateItem(item.id, { price: Number(event.target.value) || 0 })}
                  />
                </label>

                <label>
                  Description
                  <textarea value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} />
                </label>

                <label>
                  Seller notes
                  <textarea
                    placeholder="Example: slight dent on the left side, USB port does not work"
                    value={item.notes}
                    onChange={(event) => updateItem(item.id, { notes: event.target.value })}
                  />
                </label>

                <button
                  className="secondary"
                  onClick={() =>
                    updateItem(item.id, {
                      description: `${item.description}\n\nSeller notes:\n${item.notes || 'None added.'}`
                    })
                  }
                >
                  Apply notes into description
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
