'use client';

import { useMemo, useState } from 'react';

export default function HomePage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const previews = useMemo(() => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })), [files]);

  async function handleAnalyze() {
    if (!files.length) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    for (const file of files) formData.append('photos', file);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to analyze uploads.');
      setLoading(false);
      return;
    }

    setItems(data.items || []);
    setLoading(false);
  }

  function updateItem(id, patch) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <main className="grid">
      <section className="card grid">
        <h1>Garage Sale</h1>
        <p>
          Drop in a folder worth of photos, then get grouped Marketplace-ready draft listings. Add notes like “USB port does not work” and adjust title, price,
          or description before posting.
        </p>
        <div className="upload-box grid">
          <input
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
          <div>
            <button className="primary" disabled={loading || !files.length} onClick={handleAnalyze}>
              {loading ? 'Analyzing photos…' : 'Generate listings'}
            </button>
          </div>
          {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        </div>
      </section>

      {items.length > 0 && (
        <section className="item-grid">
          {items.map((item) => (
            <article className="card listing" key={item.id}>
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
                Seller notes (feeds your manual edits)
                <textarea
                  placeholder="Example: slight dent on the left side, includes charger"
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
        </section>
      )}
    </main>
  );
}
