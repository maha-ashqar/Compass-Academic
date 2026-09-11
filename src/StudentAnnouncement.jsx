import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FiArrowLeft,
  FiCalendar,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiUsers,
} from 'react-icons/fi';

import {
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  getStudentAnnouncement,
  markStudentAnnouncementRead,
} from './api/studentAnnouncements';

import './StudentAnnouncement.css';

export default function StudentAnnouncement() {
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const announcementId =
    useMemo(() => {
      const parts =
        location.pathname
          .split('/')
          .filter(Boolean);

      const index =
        parts.indexOf(
          'announcements'
        );

      if (
        index === -1 ||
        !parts[index + 1]
      ) {
        return null;
      }

      return parts[index + 1];
    }, [location.pathname]);

  useEffect(() => {
    if (!announcementId) {
      setError(
        'Announcement unavailable.'
      );

      setLoading(false);

      return;
    }

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getStudentAnnouncement(
            announcementId
          );

        if (!active) {
          return;
        }

        const announcement =
          response.announcement ||
          null;

        setItem(
          announcement
        );

        if (announcement) {
          try {
            await markStudentAnnouncementRead(
              announcement.id
            );
          } catch {
            return;
          }
        }
      } catch (
        requestError
      ) {
        if (!active) {
          return;
        }

        setError(
          requestError.message ||
            'Announcement unavailable.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [announcementId]);

  const openAttachment =
    () => {
      if (
        !item?.attachment
          ?.dataUrl
      ) {
        return;
      }

      window.open(
        item.attachment.dataUrl,
        '_blank',
        'noopener,noreferrer'
      );
    };

  const openRelatedPage =
    () => {
      if (!item?.link) {
        return;
      }

      if (
        /^https?:\/\//i.test(
          item.link
        )
      ) {
        window.open(
          item.link,
          '_blank',
          'noopener,noreferrer'
        );

        return;
      }

      navigate(item.link);
    };

  if (loading) {
    return (
      <div className="sa-not-found">
        <h2>
          Loading announcement...
        </h2>
      </div>
    );
  }

  if (
    error ||
    !item ||
    item.status !== 'published'
  ) {
    return (
      <div className="sa-not-found">
        <h2>
          Announcement unavailable
        </h2>

        <button
          onClick={() =>
            navigate(
              '/student-dashboard'
            )
          }
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <article className="sa-page">
      <button
        className="sa-back"
        onClick={() =>
          navigate(
            '/student-dashboard',
            {
              state: {
                activeTab:
                  'Notifications',
              },
            }
          )
        }
      >
        <FiArrowLeft />
        Back to notifications
      </button>

      <header>
        <small>
          {item.type}
        </small>

        <h1>
          {item.title}
        </h1>

        <div>
          <span>
            <FiCalendar />

            {new Date(
              item.publishedAt
            ).toLocaleString()}
          </span>

          <span>
            <FiUsers />

            {item.audienceLabel}
          </span>
        </div>
      </header>

      <section className="sa-content">
        {item.content
          .split('\n')
          .map(
            (
              line,
              index
            ) => (
              <p key={index}>
                {line || <br />}
              </p>
            )
          )}
      </section>

      {item.attachment && (
        <button
          className="sa-resource"
          onClick={
            openAttachment
          }
        >
          <FiFileText />

          <span>
            <strong>
              {
                item
                  .attachment
                  .name
              }
            </strong>

            <small>
              {
                item
                  .attachment
                  .size
              }
            </small>
          </span>

          <FiDownload />
        </button>
      )}

      {item.link && (
        <button
          className="sa-related"
          onClick={
            openRelatedPage
          }
        >
          <FiExternalLink />

          Open related page
        </button>
      )}

      <footer>
        Published by{' '}
        {item.author ||
          'Compass Academy'}
      </footer>
    </article>
  );
}