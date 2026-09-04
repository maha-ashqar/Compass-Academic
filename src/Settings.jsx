import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiHelpCircle,
  FiKey,
  FiLock,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiMoon,
  FiShield,
  FiStar,
  FiType,
  FiUser,
  FiX,
} from 'react-icons/fi';
import {
  DEFAULT_SETTINGS,
  useSettings,
} from './SettingsContext';
import { clearCurrentUser } from './studentsData';
import './Settings.css';

const clone = (value) =>
  JSON.parse(JSON.stringify(value));

function Toggle({
  checked,
  onChange,
  label,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`student-settings-toggle ${
        checked ? 'is-on' : ''
      }`}
      onClick={() =>
        onChange(!checked)
      }
    >
      <span />
    </button>
  );
}

function SettingsRow({
  icon: Icon,
  title,
  value,
  open,
  onClick,
  children,
  control,
}) {
  const content = (
    <>
      <span className="student-settings-row-icon">
        <Icon />
      </span>

      <span className="student-settings-row-title">
        {title}
      </span>

      {control ? (
        <span className="student-settings-row-control">
          {control}
        </span>
      ) : value ? (
        <span className="student-settings-row-value">
          {value}
        </span>
      ) : null}

      {onClick &&
        (open ? (
          <FiChevronDown className="student-settings-chevron" />
        ) : (
          <FiChevronRight className="student-settings-chevron" />
        ))}
    </>
  );

  return (
    <div
      className={`student-settings-row-wrap ${
        open ? 'is-open' : ''
      }`}
    >
      {control ? (
        <div className="student-settings-row">
          {content}
        </div>
      ) : (
        <button
          type="button"
          className="student-settings-row"
          onClick={onClick}
          aria-expanded={
            onClick ? open : undefined
          }
        >
          {content}
        </button>
      )}

      {open && children && (
        <div className="student-settings-expanded">
          {children}
        </div>
      )}
    </div>
  );
}

function SettingsGroup({
  title,
  children,
}) {
  return (
    <section className="student-settings-group">
      <header>{title}</header>

      <div>{children}</div>
    </section>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>

      <Toggle
        checked={checked}
        label={title}
        onChange={onChange}
      />
    </div>
  );
}

function Settings({
  student,
  onLogout,
}) {
  const navigate = useNavigate();

  const {
    settings,
    devices,
    saveSettings,
    resetSettings,
    changePassword,
    removeDevice,
    signOutOtherSessions,
    syncState,
    error: settingsError,
  } = useSettings();

  const [draft, setDraft] = useState(
    () => clone(settings)
  );

  const [openRow, setOpenRow] =
    useState(null);

  const [notice, setNotice] =
    useState(null);

  const [passwords, setPasswords] =
    useState({
      current: '',
      next: '',
      confirm: '',
    });

  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);

  const [rating, setRating] =
    useState(0);

  useEffect(() => {
    setDraft(clone(settings));
  }, [settings]);

  const dirty = useMemo(
    () =>
      JSON.stringify(draft) !==
      JSON.stringify(settings),
    [draft, settings]
  );

  const enabledNotificationCount =
    useMemo(
      () =>
        Object.values(
          draft.notifications
        ).filter(Boolean).length,
      [draft.notifications]
    );

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener(
      'beforeunload',
      warn
    );

    return () =>
      window.removeEventListener(
        'beforeunload',
        warn
      );
  }, [dirty]);

  const patch = (next) => {
    setDraft((current) => ({
      ...current,
      ...next,
    }));

    setNotice(null);
  };

  const patchGroup = (
    group,
    next
  ) => {
    setDraft((current) => ({
      ...current,
      [group]: {
        ...current[group],
        ...next,
      },
    }));

    setNotice(null);
  };

  const toggleRow = (id) =>
    setOpenRow((current) =>
      current === id ? null : id
    );

  const save = async () => {
    const result =
      await saveSettings(draft);

    setNotice(
      result.ok
        ? {
            type: 'success',
            text: 'Your settings were saved successfully.',
          }
        : {
            type: 'error',
            text:
              result.error ||
              'Settings could not be saved. Please try again.',
          }
    );
  };

  const reset = async () => {
    if (
      !window.confirm(
        'Restore all settings to their default values?'
      )
    ) {
      return;
    }

    const result =
      await resetSettings();

    if (result.ok) {
      setDraft(
        clone(
          result.settings ||
            DEFAULT_SETTINGS
        )
      );

      setNotice({
        type: 'success',
        text: 'Default settings were restored.',
      });

      return;
    }

    setNotice({
      type: 'error',
      text:
        result.error ||
        'Default settings could not be restored.',
    });
  };

  const handleChangePassword =
    async (event) => {
      event.preventDefault();

      if (
        !passwords.current ||
        passwords.next.length < 8
      ) {
        setNotice({
          type: 'error',
          text: 'Enter your current password and a new password of at least 8 characters.',
        });

        return;
      }

      if (
        passwords.next !==
        passwords.confirm
      ) {
        setNotice({
          type: 'error',
          text: 'The new password and confirmation do not match.',
        });

        return;
      }

      try {
        setPasswordSaving(true);

        const result =
          await changePassword({
            current_password:
              passwords.current,
            password:
              passwords.next,
            password_confirmation:
              passwords.confirm,
          });

        if (!result.ok) {
          setNotice({
            type: 'error',
            text:
              result.error ||
              'Password could not be updated.',
          });

          return;
        }

        setPasswords({
          current: '',
          next: '',
          confirm: '',
        });

        setOpenRow(null);

        setNotice({
          type: 'success',
          text:
            result.message ||
            'Password updated successfully.',
        });
      } finally {
        setPasswordSaving(false);
      }
    };

  const logout = () => {
    if (
      !window.confirm(
        'Are you sure you want to log out?'
      )
    ) {
      return;
    }

    onLogout?.();

    if (!onLogout) {
      clearCurrentUser();
    }

    navigate('/login', {
      replace: true,
    });
  };

  const logoutOtherDevices = () => {
    if (
      !window.confirm(
        'Sign out from all other devices?'
      )
    ) {
      return;
    }

    signOutOtherSessions();

    setNotice({
      type: 'success',
      text: 'Other sessions were signed out.',
    });
  };

  const name =
    student?.displayName ||
    student?.fullName ||
    'Student';

  const subtitle =
    student?.program ||
    student?.major ||
    'Active Student';

  const avatar = student?.avatar;

  const syncLabel = dirty
    ? 'Unsaved changes'
    : syncState === 'loading'
      ? 'Loading settings...'
      : syncState === 'saving'
        ? 'Saving changes...'
        : syncState === 'synced'
          ? 'Settings synchronized'
          : syncState === 'error'
            ? settingsError ||
              'Settings sync failed'
            : 'All changes saved';

  return (
    <main
      className="student-settings-page"
      dir="ltr"
    >
      <div className="student-settings-title-row">
        <div>
          <span>Account preferences</span>
          <h1>Settings</h1>
          <p>
            Manage your account,
            appearance, notifications,
            privacy, and support
            preferences.
          </p>
        </div>

        <button
          type="button"
          className="student-settings-save-top"
          disabled={
            !dirty ||
            syncState === 'saving'
          }
          onClick={save}
        >
          <FiCheck />
          {syncState === 'saving'
            ? 'Saving...'
            : 'Save changes'}
        </button>
      </div>

      {notice && (
        <div
          className={`student-settings-notice ${notice.type}`}
          role="status"
        >
          {notice.type === 'success' ? (
            <FiCheck />
          ) : (
            <FiShield />
          )}

          <span>{notice.text}</span>

          <button
            type="button"
            aria-label="Close"
            onClick={() =>
              setNotice(null)
            }
          >
            <FiX />
          </button>
        </div>
      )}

      <section className="student-settings-profile-card">
        <div className="student-settings-profile-main">
          <div className="student-settings-avatar">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
              />
            ) : (
              <FiUser />
            )}
          </div>

          <div className="student-settings-profile-copy">
            <div>
              <h2>{name}</h2>

              <span className="student-settings-active">
                <FiCheck />
                Active account
              </span>
            </div>

            <p>{subtitle}</p>

            <small>
              {student?.email ||
                'student@university.edu'}
            </small>
          </div>
        </div>

        <button
          type="button"
          className="student-settings-edit"
          onClick={() =>
            navigate('/edit-profile')
          }
        >
          <FiEdit2 />
          Edit profile
        </button>
      </section>

      <div className="student-settings-groups">
        <SettingsGroup title="The Account">
          <SettingsRow
            icon={FiUser}
            title="Edit profile"
            onClick={() =>
              navigate('/edit-profile')
            }
          />

          <SettingsRow
            icon={FiLock}
            title="Change password"
            open={openRow === 'password'}
            onClick={() =>
              toggleRow('password')
            }
          >
            <form
              className="student-settings-form"
              onSubmit={
                handleChangePassword
              }
            >
              <label>
                Current password
                <input
                  type="password"
                  value={
                    passwords.current
                  }
                  onChange={(event) =>
                    setPasswords({
                      ...passwords,
                      current:
                        event.target
                          .value,
                    })
                  }
                  autoComplete="current-password"
                />
              </label>

              <label>
                New password
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(event) =>
                    setPasswords({
                      ...passwords,
                      next:
                        event.target
                          .value,
                    })
                  }
                  autoComplete="new-password"
                />
              </label>

              <label>
                Confirm new password
                <input
                  type="password"
                  value={
                    passwords.confirm
                  }
                  onChange={(event) =>
                    setPasswords({
                      ...passwords,
                      confirm:
                        event.target
                          .value,
                    })
                  }
                  autoComplete="new-password"
                />
              </label>

              <button
                type="submit"
                disabled={passwordSaving}
              >
                {passwordSaving
                  ? 'Updating...'
                  : 'Update password'}
              </button>
            </form>
          </SettingsRow>

          <SettingsRow
            icon={FiMonitor}
            title="Device management"
            value={`${devices.length} sessions`}
            open={openRow === 'devices'}
            onClick={() =>
              toggleRow('devices')
            }
          >
            <div className="student-settings-device-list">
              {devices.map(
                (device) => (
                  <div
                    key={device.id}
                    className="student-settings-device"
                  >
                    <FiMonitor />

                    <div>
                      <strong>
                        {device.name}
                      </strong>

                      <small>
                        {device.location} ·{' '}
                        {
                          device.lastActive
                        }
                      </small>
                    </div>

                    {device.current ? (
                      <span>
                        Current
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          removeDevice(
                            device.id
                          )
                        }
                      >
                        Sign out
                      </button>
                    )}
                  </div>
                )
              )}

              {devices.some(
                (device) =>
                  !device.current
              ) && (
                <button
                  type="button"
                  className="student-settings-outline"
                  onClick={
                    logoutOtherDevices
                  }
                >
                  Sign out other
                  devices
                </button>
              )}
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Appearance">
          <SettingsRow
  icon={FiMoon}
  title="Dark mode"
  control={
    <Toggle
      checked={settings.theme === 'dark'}
      label="Dark mode"
      onChange={async (checked) => {
        const nextSettings = {
          ...settings,
          theme: checked ? 'dark' : 'light',
        };

        setDraft(clone(nextSettings));

        const result = await saveSettings(
          nextSettings
        );

        if (!result.ok) {
          setNotice({
            type: 'error',
            text:
              result.error ||
              'Theme could not be changed.',
          });
        }
      }}
    />
  }
/>
          <SettingsRow
            icon={FiEye}
            title="Language selection"
            value={
              draft.language === 'ar'
                ? 'Arabic'
                : 'English'
            }
            open={
              openRow === 'language'
            }
            onClick={() =>
              toggleRow('language')
            }
          >
            <div className="student-settings-options">
              <button
                type="button"
                className={
                  draft.language ===
                  'en'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  patch({
                    language: 'en',
                  })
                }
              >
                English
              </button>

              <button
                type="button"
                className={
                  draft.language ===
                  'ar'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  patch({
                    language: 'ar',
                  })
                }
              >
                العربية
              </button>
            </div>
          </SettingsRow>

          <SettingsRow
            icon={FiType}
            title="Font size"
            value={
              draft.accessibility
                .fontSize
            }
            open={openRow === 'font'}
            onClick={() =>
              toggleRow('font')
            }
          >
            <div className="student-settings-options">
              {[
                'small',
                'medium',
                'large',
              ].map((size) => (
                <button
                  type="button"
                  key={size}
                  className={
                    draft.accessibility
                      .fontSize === size
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    patchGroup(
                      'accessibility',
                      {
                        fontSize: size,
                      }
                    )
                  }
                >
                  {size}
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Notifications">
          <SettingsRow
            icon={FiBell}
            title="Notification preferences"
            value={`${enabledNotificationCount} enabled`}
            open={
              openRow ===
              'notifications'
            }
            onClick={() =>
              toggleRow(
                'notifications'
              )
            }
          >
            <div className="student-settings-permissions">
              <PreferenceToggle
                title="Assignments"
                description="Submission, deadline, and assignment updates."
                checked={
                  draft.notifications
                    .assignment
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      assignment:
                        checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Grades"
                description="Grades and trainer feedback."
                checked={
                  draft.notifications
                    .grade
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      grade: checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Courses"
                description="Important course and learning updates."
                checked={
                  draft.notifications
                    .course
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      course: checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Projects"
                description="Project review and status updates."
                checked={
                  draft.notifications
                    .project
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      project: checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Competitions"
                description="Competition registration and result updates."
                checked={
                  draft.notifications
                    .competition
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      competition:
                        checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Messages"
                description="Direct message activity."
                checked={
                  draft.notifications
                    .message
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      message: checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Announcements"
                description="Important academy announcements."
                checked={
                  draft.notifications
                    .announcement
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      announcement:
                        checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Achievements"
                description="Certificates and achievement updates."
                checked={
                  draft.notifications
                    .achievement
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      achievement:
                        checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Team activity"
                description="Team and collaboration activity."
                checked={
                  draft.notifications.team
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      team: checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Browser notifications"
                description="Browser push notification preference."
                checked={
                  draft.notifications
                    .browser
                }
                onChange={(checked) =>
                  patchGroup(
                    'notifications',
                    {
                      browser: checked,
                    }
                  )
                }
              />
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Privacy and Security">
          <SettingsRow
            icon={FiShield}
            title="Two-factor authentication"
            control={
              <Toggle
                checked={
                  draft.security
                    .twoFactor
                }
                label="Two-factor authentication"
                onChange={(checked) =>
                  patchGroup(
                    'security',
                    {
                      twoFactor:
                        checked,
                    }
                  )
                }
              />
            }
          />

          <SettingsRow
            icon={FiKey}
            title="Permissions"
            open={
              openRow ===
              'permissions'
            }
            onClick={() =>
              toggleRow('permissions')
            }
          >
            <div className="student-settings-permissions">
              <label>
                <span>
                  Profile visibility
                </span>

                <select
                  value={
                    draft.privacy
                      .profileVisibility
                  }
                  onChange={(event) =>
                    patchGroup(
                      'privacy',
                      {
                        profileVisibility:
                          event.target
                            .value,
                      }
                    )
                  }
                >
                  <option value="academy">
                    Academy members
                  </option>

                  <option value="instructors">
                    My instructors
                  </option>

                  <option value="private">
                    Only me
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Portfolio visibility
                </span>

                <select
                  value={
                    draft.privacy
                      .portfolioVisibility
                  }
                  onChange={(event) =>
                    patchGroup(
                      'privacy',
                      {
                        portfolioVisibility:
                          event.target
                            .value,
                      }
                    )
                  }
                >
                  <option value="public">
                    Public
                  </option>

                  <option value="private">
                    Private
                  </option>
                </select>
              </label>

              <PreferenceToggle
                title="Show learning activity"
                description="Allow approved users to see your progress."
                checked={
                  draft.privacy
                    .showActivity
                }
                onChange={(checked) =>
                  patchGroup(
                    'privacy',
                    {
                      showActivity:
                        checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Show achievements"
                description="Display certificates and awards on your profile."
                checked={
                  draft.privacy
                    .showAchievements
                }
                onChange={(checked) =>
                  patchGroup(
                    'privacy',
                    {
                      showAchievements:
                        checked,
                    }
                  )
                }
              />

              <PreferenceToggle
                title="Instructor messages"
                description="Allow course instructors to contact you."
                checked={
                  draft.privacy
                    .allowInstructorMessages
                }
                onChange={(checked) =>
                  patchGroup(
                    'privacy',
                    {
                      allowInstructorMessages:
                        checked,
                    }
                  )
                }
              />
            </div>
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Support">
          <SettingsRow
            icon={FiHelpCircle}
            title="Help center"
            onClick={() =>
              window.open(
                'mailto:support@compass.academy?subject=Help%20center',
                '_self'
              )
            }
          />

          <SettingsRow
            icon={FiMail}
            title="Contact us"
            onClick={() =>
              window.open(
                'mailto:support@compass.academy',
                '_self'
              )
            }
          />

          <SettingsRow
            icon={FiStar}
            title="App rating"
            value={
              rating
                ? `${rating}/5`
                : ''
            }
            open={
              openRow === 'rating'
            }
            onClick={() =>
              toggleRow('rating')
            }
          >
            <div
              className="student-settings-rating"
              aria-label="Rate Compass Academy"
            >
              {[
                1,
                2,
                3,
                4,
                5,
              ].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    value <= rating
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setRating(value);

                    setNotice({
                      type: 'success',
                      text: `Thank you for rating Compass Academy ${value} out of 5.`,
                    });
                  }}
                >
                  <FiStar />
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsGroup>
      </div>

      <footer className="student-settings-footer">
        <div>
          <button
            type="button"
            className="student-settings-reset"
            onClick={reset}
            disabled={
              syncState === 'saving'
            }
          >
            Restore defaults
          </button>

          <span
            className={
              dirty ? 'pending' : ''
            }
          >
            {syncLabel}
          </span>
        </div>

        <button
          type="button"
          className="student-settings-logout"
          onClick={logout}
        >
          <FiLogOut />
          Log out
        </button>
      </footer>
    </main>
  );
}

export default Settings;
