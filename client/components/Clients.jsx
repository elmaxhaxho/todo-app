
'use client';

import { useState, useEffect } from 'react';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });


  const fetchClients = async () => {
    try {
      setError('');

      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await res.json();

      setClients(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchClients();
  }, []);


  const handleOpenModal = (client = null) => {
    setEditingClient(client);

    setForm({
      name: client?.name || '',
      company: client?.company || '',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || '',
      notes: client?.notes || '',
    });

    setIsModalOpen(true);
  };


  const handleSave = async () => {
    if (!form.name.trim()) {
      return alert('Client name is required.');
    }

    try {
      const token = localStorage.getItem('token');

      const method = editingClient ? 'PUT' : 'POST';

      const url = editingClient
        ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${editingClient._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        throw new Error(
          data.message || 'Failed to save client'
        );
      }

      setIsModalOpen(false);
      setEditingClient(null);

      await fetchClients();

    } catch (err) {
      alert(err.message);
    }
  };


  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        throw new Error(
          data.message || 'Failed to delete client'
        );
      }

      /*
        Remove it immediately from the current display.
      */
      setClients((currentClients) =>
        currentClients.filter(
          (client) => client._id !== id
        )
      );

      /*
        Refresh from the backend to make sure
        the UI matches the database.
      */
      await fetchClients();

    } catch (err) {
      alert(err.message);
    }
  };


  return (
    <section className="page-section">

      <div className="content-header">

        <div>
          <h1>Clients</h1>

          <p>
            Manage your client information.
          </p>
        </div>

        <button
          className="new-project-btn"
          onClick={() => handleOpenModal()}
        >
          + Add Client
        </button>

      </div>


      <div className="admin-list">

        {loading ? null : error ? (

          <p style={{ color: '#d85c5c' }}>
            {error}
          </p>

        ) : !clients.length ? (

          <p style={{ color: '#858595' }}>
            No clients yet.
          </p>

        ) : (

          clients.map((c) => (

            <div
              className="admin-card"
              key={c._id}
            >

              <div>

                <h3>
                  {c.name}
                </h3>

                <p>
                  {c.company || ''}
                </p>

                <p>
                  {c.email || ''}{' '}
                  {c.phone ? `· ${c.phone}` : ''}
                </p>

                {c.address && (
                  <p>
                    {c.address}
                  </p>
                )}

                {c.notes && (
                  <p>
                    {c.notes}
                  </p>
                )}

              </div>


              <div className="project-actions">

                <button
                  className="archive-project"
                  onClick={() => handleOpenModal(c)}
                >
                  Edit
                </button>

                <button
                  className="delete-project"
                  onClick={() => handleDelete(c._id)}
                >
                  Delete
                </button>

              </div>

            </div>

          ))

        )}

      </div>


      {isModalOpen && (

        <div
          className="modal"
          onClick={() => setIsModalOpen(false)}
        >

          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >

            <h3>
              {editingClient
                ? 'Edit Client'
                : 'Add Client'}
            </h3>


            <div className="input-group">

              <label>
                Name
              </label>

              <input
                type="text"
                placeholder="Client name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
              />

            </div>


            <div className="input-group">

              <label>
                Company
              </label>

              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) =>
                  setForm({
                    ...form,
                    company: e.target.value
                  })
                }
              />

            </div>


            <div className="input-group">

              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
              />

            </div>


            <div className="input-group">

              <label>
                Phone
              </label>

              <input
                type="text"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value
                  })
                }
              />

            </div>


            <div className="input-group">

              <label>
                Address
              </label>

              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value
                  })
                }
              />

            </div>


            <div className="input-group">

              <label>
                Notes
              </label>

              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value
                  })
                }
              />

            </div>


            <div className="modal-actions">

              <button
                className="btn-secondary"
                onClick={() =>
                  setIsModalOpen(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleSave}
              >
                Save Client
              </button>

            </div>

          </div>

        </div>

      )}

    </section>
  );
}

