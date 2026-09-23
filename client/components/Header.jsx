'use client';

export default function Header({
  username,
  searchTerm,
  setSearchTerm,
  onProfileClick
}) {

  return (
    <header className="header">

      <div className="logo">
        TODO
      </div>

      <div className="search-container">

        <input
          type="text"
          className="search-bar"
          placeholder="Search projects or tasks..."
          value={searchTerm ?? ''}
          onChange={(e) =>
            setSearchTerm?.(
              e.target.value
            )
          }
        />

      </div>

      <div
        className="profile"
        onClick={onProfileClick}
        style={{
          cursor: 'pointer'
        }}
      >

        <div className="profile-picture">

          <img
            src="/profile.jpg"
            alt="Profile picture"
          />

        </div>

        <span className="username">
          {username || 'User'}
        </span>

      </div>

    </header>
  );
}