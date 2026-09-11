/* eslint-disable react-refresh/only-export-components */

import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiEdit2,
  FiExternalLink,
  FiFileText,
  FiGithub,
  FiLinkedin,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUpload,
  FiUser,
  FiX,
} from 'react-icons/fi';

import {
  getTrainerProfile,
  updateTrainerProfile,
  uploadTrainerAvatar,
  deleteTrainerAvatar,
  uploadTrainerDegreeCertificate,
} from './api/trainerProfile';

import './TrainerProfile.css';

const id = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

export const maskNationalId = (
  value = ''
) =>
  value
    ? `${'•'.repeat(
        Math.max(
          6,
          String(value).length - 3
        )
      )}${String(value).slice(-3)}`
    : 'Not available';

const avatar = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?backgroundColor=deebf1&seed=${encodeURIComponent(
    name || 'Trainer'
  )}`;

const normalizeProfile = (
  data = {},
  trainerData = {}
) => {
  const fallbackName = String(
    trainerData.fullName ||
      trainerData.displayName ||
      ''
  ).replace(/^Eng\.\s*/i, '');
const addSpecialization = () => {
  const value = skill.trim();

  if (!value) {
    return;
  }

  const exists = draft.specializations.some(
    (item) =>
      item.name.toLowerCase() ===
      value.toLowerCase()
  );

  if (exists) {
    setSkill('');
    return;
  }

  set(
    'specializations',
    [
      ...draft.specializations,
      {
        id: id(),
        name: value,
      },
    ]
  );

  setSkill('');
};
  return {
    id:
      data.id ??
      trainerData.id ??
      null,

    fullName:
      data.name ||
      fallbackName ||
      '',

    email:
      data.email ||
      trainerData.email ||
      '',

    phone:
      data.phone ??
      trainerData.phone ??
      '',

    avatar:
      data.avatar ??
      trainerData.avatar ??
      '',

    jobTitle:
      data.job_title ??
      trainerData.jobTitle ??
      trainerData.major ??
      '',

    university:
      data.university ??
      trainerData.university ??
      '',

    faculty:
      data.faculty ??
      trainerData.faculty ??
      '',

    department:
      data.department ??
      trainerData.department ??
      '',

    office:
      data.office ??
      trainerData.office ??
      '',

    officeHours:
      data.office_hours ??
      trainerData.officeHours ??
      '',

    extension:
      data.extension ??
      trainerData.extension ??
      '',

    employmentStatus:
      data.employment_status ??
      trainerData.employmentStatus ??
      '',

    yearsOfExperience:
      data.years_of_experience ??
      trainerData.yearsOfExperience ??
      '',

    employeeId:
      data.employee_id ??
      trainerData.employeeId ??
      '',

    nationalId:
      data.national_id ??
      trainerData.nationalId ??
      '',

    academicDegree:
      data.academic_degree ??
      trainerData.academicDegree ??
      '',

    degreeSpecialization:
      data.degree_specialization ??
      trainerData.degreeSpecialization ??
      '',

    graduationYear:
      data.graduation_year ??
      trainerData.graduationYear ??
      '',

    degreeCertificateNumber:
      data.degree_certificate_number ??
      trainerData.degreeCertificateNumber ??
      '',

    degreeCertificate:
      data.degree_certificate
        ? {
            name:
              data.degree_certificate
                .name || '',

            size:
              data.degree_certificate
                .size_label || '',

            verified: Boolean(
              data.degree_certificate
                .verified
            ),

            url:
              data.degree_certificate
                .url || '',
          }
        : trainerData.degreeCertificate ||
          null,

    bio:
      data.bio ??
      trainerData.bio ??
      '',

    github:
      data.github_url ??
      trainerData.github ??
      '',

    linkedin:
      data.linkedin_url ??
      trainerData.linkedin ??
      '',

    status:
      data.status ||
      trainerData.status ||
      'active',

    isVerified:
      data.is_verified ??
      trainerData.isVerified ??
      false,

    specializations: (
      data.specializations ||
      trainerData.specializations ||
      []
    ).map((item) => ({
      id: item.id ?? id(),

      name:
        typeof item === 'string'
          ? item
          : item.name || '',
    })),

    experiences: (
      data.experiences ||
      trainerData.experiences ||
      []
    ).map((item) => ({
      id: item.id ?? id(),

      role:
        item.job_title ??
        item.role ??
        '',

      organization:
        item.organization ?? '',

      from:
        item.start_year ??
        item.from ??
        '',

      to: item.is_current
        ? 'Present'
        : item.end_year ??
          item.to ??
          '',

      description:
        item.description ?? '',
    })),

    certificates: (
      data.certificates ||
      trainerData.certificates ||
      []
    ).map((item) => ({
      id: item.id ?? id(),

      name: item.name || '',

      issuer: item.issuer || '',

      year:
        item.issue_year ??
        item.year ??
        '',

      verificationUrl:
        item.credential_url ??
        item.verificationUrl ??
        '',

      verified:
        item.is_verified ??
        item.verified ??
        false,
    })),
  };
};

const nullable = (value) => {
  const cleaned = String(
    value ?? ''
  ).trim();

  return cleaned || null;
};

const optionalYear = (value) => {
  const cleaned = String(
    value ?? ''
  ).trim();

  if (
    !cleaned ||
    cleaned.toLowerCase() ===
      'present'
  ) {
    return null;
  }

  const year = Number(cleaned);

  return Number.isInteger(year)
    ? year
    : null;
};

export default function TrainerProfile({
  trainerData,
  onUpdate,
  editMode = false,
}) {
  const navigate = useNavigate();

  const initialProfile =
    normalizeProfile(
      {},
      trainerData
    );

  const [profile, setProfile] =
    useState(initialProfile);

  const [draft, setDraft] =
    useState(initialProfile);

  const [photo, setPhoto] =
    useState(
      initialProfile.avatar
    );

  const [
    photoFile,
    setPhotoFile,
  ] = useState(null);

  const [
    removePhoto,
    setRemovePhoto,
  ] = useState(false);

  const [
    degreeCertificateFile,
    setDegreeCertificateFile,
  ] = useState(null);

  const [skill, setSkill] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const dirty =
    JSON.stringify(draft) !==
      JSON.stringify(profile) ||
    photo !== profile.avatar ||
    Boolean(photoFile) ||
    removePhoto ||
    Boolean(degreeCertificateFile);

  useEffect(() => {
    let active = true;

    const loadProfile =
      async () => {
        try {
          setLoading(true);
          setError('');

          const response =
            await getTrainerProfile();

          if (!active) {
            return;
          }

          const normalized =
            normalizeProfile(
              response.profile,
              trainerData
            );

          setProfile(
            normalized
          );

          setDraft(
            normalized
          );

          setPhoto(
            normalized.avatar
          );
        } catch (
          requestError
        ) {
          if (active) {
            setError(
              requestError.message
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      !editMode ||
      !dirty
    ) {
      return undefined;
    }

    const stop = (event) => {
      event.preventDefault();

      event.returnValue = '';
    };

    window.addEventListener(
      'beforeunload',
      stop
    );

    return () =>
      window.removeEventListener(
        'beforeunload',
        stop
      );
  }, [
    dirty,
    editMode,
  ]);

  const set = (
    key,
    value
  ) => {
    setDraft(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  };

  const readPhoto = (
    file
  ) => {
    if (!file) {
      return;
    }

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type) ||
      file.size >
        5 * 1024 * 1024
    ) {
      setError(
        'Photo must be JPG, PNG, or WebP and smaller than 5 MB.'
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setPhoto(
        String(
          reader.result || ''
        )
      );

      setPhotoFile(file);

      setRemovePhoto(false);

      setError('');
    };

    reader.readAsDataURL(
      file
    );
  };

  const handleRemovePhoto =
    () => {
      setPhoto('');

      setPhotoFile(null);

      setRemovePhoto(true);

      setError('');
    };

  const readDegree = (
    file
  ) => {
    if (!file) {
      return;
    }

    if (
      ![
        'application/pdf',
        'image/jpeg',
        'image/png',
      ].includes(file.type) ||
      file.size >
        20 * 1024 * 1024
    ) {
      setError(
        'Certificate must be PDF, JPG, or PNG and smaller than 20 MB.'
      );

      return;
    }

    setDegreeCertificateFile(
      file
    );

    set(
      'degreeCertificate',
      {
        name: file.name,

        size:
          file.size >=
          1024 * 1024
            ? `${(
                file.size /
                1024 /
                1024
              ).toFixed(
                1
              )} MB`
            : `${Math.ceil(
                file.size /
                  1024
              )} KB`,

        verified: false,

        url: '',
      }
    );

    setError('');
  };

  const buildPayload =
    () => {
      if (
        !draft.fullName.trim() ||
        !draft.email.trim() ||
        !draft.jobTitle.trim()
      ) {
        throw new Error(
          'Full name, email, and job title are required.'
        );
      }

      const experiences =
        draft.experiences.filter(
          (item) =>
            item.role?.trim() ||
            item.organization?.trim() ||
            String(
              item.from || ''
            ).trim() ||
            String(
              item.to || ''
            ).trim() ||
            item.description?.trim()
        );

      for (
        const item of experiences
      ) {
        if (
          !item.role?.trim() ||
          !item.organization?.trim()
        ) {
          throw new Error(
            'Role and organization are required for every experience.'
          );
        }

        const from =
          String(
            item.from ?? ''
          ).trim();

        const to =
          String(
            item.to ?? ''
          ).trim();

        if (
          from &&
          optionalYear(
            from
          ) === null &&
          from.toLowerCase() !==
            'present'
        ) {
          throw new Error(
            'Experience start year must be a valid year.'
          );
        }

        if (
          to &&
          optionalYear(
            to
          ) === null &&
          to.toLowerCase() !==
            'present'
        ) {
          throw new Error(
            'Experience end year must be a valid year or Present.'
          );
        }
      }

      const certificates =
        draft.certificates.filter(
          (item) =>
            item.name?.trim() ||
            item.issuer?.trim() ||
            String(
              item.year || ''
            ).trim() ||
            item.verificationUrl?.trim()
        );

      for (
        const item of certificates
      ) {
        if (
          !item.name?.trim()
        ) {
          throw new Error(
            'Certificate name is required.'
          );
        }

        if (
          item.year &&
          optionalYear(
            item.year
          ) === null
        ) {
          throw new Error(
            'Certificate year must be valid.'
          );
        }
      }

      return {
        name:
          draft.fullName.trim(),

        email:
          draft.email
            .trim()
            .toLowerCase(),

        phone:
          nullable(
            draft.phone
          ),

        job_title:
          draft.jobTitle.trim(),

        bio:
          nullable(
            draft.bio
          ),

        university:
          nullable(
            draft.university
          ),

        faculty:
          nullable(
            draft.faculty
          ),

        department:
          nullable(
            draft.department
          ),

        office:
          nullable(
            draft.office
          ),

        office_hours:
          nullable(
            draft.officeHours
          ),

        extension:
          nullable(
            draft.extension
          ),

        github_url:
          nullable(
            draft.github
          ),

        linkedin_url:
          nullable(
            draft.linkedin
          ),

        employment_status:
          nullable(
            draft.employmentStatus
          ),

        years_of_experience:
          nullable(
            draft.yearsOfExperience
          ),

        academic_degree:
          nullable(
            draft.academicDegree
          ),

        degree_specialization:
          nullable(
            draft.degreeSpecialization
          ),

        graduation_year:
          draft.graduationYear
            ? Number(
                draft.graduationYear
              )
            : null,

        degree_certificate_number:
          nullable(
            draft.degreeCertificateNumber
          ),

        specializations:
          draft.specializations
            .map(
              (item) => ({
                name:
                  item.name.trim(),
              })
            )
            .filter(
              (item) =>
                item.name
            ),

        experiences:
          experiences.map(
            (item) => {
              const current =
                String(
                  item.to ??
                    ''
                )
                  .trim()
                  .toLowerCase() ===
                'present';

              const numericId =
                Number(
                  item.id
                );

              return {
                ...(Number.isInteger(
                  numericId
                )
                  ? {
                      id: numericId,
                    }
                  : {}),

                job_title:
                  item.role.trim(),

                organization:
                  item.organization.trim(),

                start_year:
                  optionalYear(
                    item.from
                  ),

                end_year:
                  current
                    ? null
                    : optionalYear(
                        item.to
                      ),

                is_current:
                  current,

                description:
                  nullable(
                    item.description
                  ),
              };
            }
          ),

        certificates:
          certificates.map(
            (item) => {
              const numericId =
                Number(
                  item.id
                );

              return {
                ...(Number.isInteger(
                  numericId
                )
                  ? {
                      id: numericId,
                    }
                  : {}),

                name:
                  item.name.trim(),

                issuer:
                  nullable(
                    item.issuer
                  ),

                issue_year:
                  optionalYear(
                    item.year
                  ),

                credential_url:
                  nullable(
                    item.verificationUrl
                  ),
              };
            }
          ),
      };
    };

  const updateParentProfile =
    (normalized) => {
      onUpdate?.({
        ...(trainerData ||
          {}),

        ...normalized,

        fullName:
          normalized.fullName,

        displayName:
          `Eng. ${normalized.fullName}`,

        major:
          normalized.jobTitle,

        jobTitle:
          normalized.jobTitle,

        avatar:
          normalized.avatar,

        email:
          normalized.email,

        phone:
          normalized.phone,
      });
    };

  const save = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      setError('');

      const payload =
        buildPayload();

      let response =
        await updateTrainerProfile(
          payload
        );

      if (removePhoto) {
        response =
          await deleteTrainerAvatar();
      } else if (
        photoFile
      ) {
        response =
          await uploadTrainerAvatar(
            photoFile
          );
      }

      if (
        degreeCertificateFile
      ) {
        response =
          await uploadTrainerDegreeCertificate(
            degreeCertificateFile
          );
      }

      const normalized =
        normalizeProfile(
          response.profile,
          trainerData
        );

      setProfile(
        normalized
      );

      setDraft(
        normalized
      );

      setPhoto(
        normalized.avatar
      );

      setPhotoFile(null);

      setRemovePhoto(false);

      setDegreeCertificateFile(
        null
      );

      updateParentProfile(
        normalized
      );

      navigate(
        '/trainer-dashboard/profile'
      );
    } catch (
      requestError
    ) {
      setError(
        requestError.message
      );
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    if (
      !dirty ||
      window.confirm(
        'Discard unsaved changes?'
      )
    ) {
      navigate(
        '/trainer-dashboard/profile'
      );
    }
  };

  if (loading) {
    return (
      <div className="trainer-profile-page">
        Loading profile...
      </div>
    );
  }

  if (editMode) {
    return (
      <div className="trainer-profile-page trainer-profile-edit">
        <ProfileHero
          profile={{
            ...draft,
            avatar: photo,
          }}
          editing
        />

        <section className="trainer-editor">
          <header className="trainer-editor-head">
            <div>
              <span>
                PROFILE SETTINGS
              </span>

              <h1>
                Edit trainer
                profile
              </h1>

              <p>
                Update your
                personal,
                professional, and
                academic
                information.
              </p>
            </div>

            <div>
              <button
                className="tp-secondary"
                onClick={
                  cancel
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

              <button
                className="tp-primary"
                onClick={save}
                disabled={
                  saving
                }
              >
                <FiSave />

                {saving
                  ? 'Saving...'
                  : 'Save changes'}
              </button>
            </div>
          </header>

          {error && (
            <div className="trainer-profile-error">
              {error}
            </div>
          )}

          <FormSection
            number="1"
            title="Personal information"
            subtitle="Public account and contact information."
          >
            <div className="trainer-photo-edit">
              <img
                src={
                  photo ||
                  avatar(
                    draft.fullName
                  )
                }
                alt=""
              />

              <div>
                <label className="tp-secondary">
                  <FiUpload />

                  Change photo

                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(
                      event
                    ) =>
                      readPhoto(
                        event
                          .target
                          .files?.[0]
                      )
                    }
                  />
                </label>

                <button
                  className="tp-danger-link"
                  onClick={
                    handleRemovePhoto
                  }
                >
                  Remove photo
                </button>

                <small>
                  JPG, PNG or
                  WebP · Max 5 MB
                </small>
              </div>
            </div>

            <div className="trainer-fields">
              <Field
                label="Full name"
                value={
                  draft.fullName
                }
                change={(
                  value
                ) =>
                  set(
                    'fullName',
                    value
                  )
                }
              />

              <Field
                label="University email"
                type="email"
                value={
                  draft.email
                }
                change={(
                  value
                ) =>
                  set(
                    'email',
                    value
                  )
                }
              />

              <Field
                label="Phone number"
                value={
                  draft.phone
                }
                change={(
                  value
                ) =>
                  set(
                    'phone',
                    value
                  )
                }
              />

              <Field
                label="Job title"
                value={
                  draft.jobTitle
                }
                change={(
                  value
                ) =>
                  set(
                    'jobTitle',
                    value
                  )
                }
              />

              <Field
                full
                area
                label="Professional summary"
                value={
                  draft.bio
                }
                change={(
                  value
                ) =>
                  set(
                    'bio',
                    value
                  )
                }
              />

              <Field
                label="GitHub profile"
                value={
                  draft.github
                }
                change={(
                  value
                ) =>
                  set(
                    'github',
                    value
                  )
                }
              />

              <Field
                label="LinkedIn profile"
                value={
                  draft.linkedin
                }
                change={(
                  value
                ) =>
                  set(
                    'linkedin',
                    value
                  )
                }
              />
            </div>
          </FormSection>

          <FormSection
            number="2"
            title="Academic information"
            subtitle="University degree, work location, and protected records."
          >
            <div className="trainer-fields">
              <Field
                label="University"
                value={
                  draft.university
                }
                change={(
                  value
                ) =>
                  set(
                    'university',
                    value
                  )
                }
              />

              <Field
                label="Faculty"
                value={
                  draft.faculty
                }
                change={(
                  value
                ) =>
                  set(
                    'faculty',
                    value
                  )
                }
              />

              <Field
                label="Department"
                value={
                  draft.department
                }
                change={(
                  value
                ) =>
                  set(
                    'department',
                    value
                  )
                }
              />

              <Field
                label="Degree"
                value={
                  draft.academicDegree
                }
                change={(
                  value
                ) =>
                  set(
                    'academicDegree',
                    value
                  )
                }
              />

              <Field
                label="Degree specialization"
                value={
                  draft.degreeSpecialization
                }
                change={(
                  value
                ) =>
                  set(
                    'degreeSpecialization',
                    value
                  )
                }
              />

              <Field
                type="number"
                label="Graduation year"
                value={
                  draft.graduationYear
                }
                change={(
                  value
                ) =>
                  set(
                    'graduationYear',
                    value
                  )
                }
              />

              <Field
                label="Certificate number"
                value={
                  draft.degreeCertificateNumber
                }
                change={(
                  value
                ) =>
                  set(
                    'degreeCertificateNumber',
                    value
                  )
                }
              />

              <Field
                label="Years of experience"
                value={
                  draft.yearsOfExperience
                }
                change={(
                  value
                ) =>
                  set(
                    'yearsOfExperience',
                    value
                  )
                }
              />

              <Field
                label="Office"
                value={
                  draft.office
                }
                change={(
                  value
                ) =>
                  set(
                    'office',
                    value
                  )
                }
              />

              <Field
                label="Office hours"
                value={
                  draft.officeHours
                }
                change={(
                  value
                ) =>
                  set(
                    'officeHours',
                    value
                  )
                }
              />

              <Field
                label="University extension"
                value={
                  draft.extension
                }
                change={(
                  value
                ) =>
                  set(
                    'extension',
                    value
                  )
                }
              />

              <Field
                label="Employment status"
                value={
                  draft.employmentStatus
                }
                change={(
                  value
                ) =>
                  set(
                    'employmentStatus',
                    value
                  )
                }
              />
            </div>

            <div className="trainer-file-row">
              <FiFileText />

              <div>
                <b>
                  University
                  degree
                  certificate
                </b>

                <small>
                  {draft
                    .degreeCertificate
                    ?.name ||
                    'No certificate'}

                  {draft
                    .degreeCertificate
                    ?.size
                    ? ` · ${draft.degreeCertificate.size}`
                    : ''}
                </small>
              </div>

              <label className="tp-secondary">
                <FiUpload />

                Replace

                <input
                  hidden
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(
                    event
                  ) =>
                    readDegree(
                      event
                        .target
                        .files?.[0]
                    )
                  }
                />
              </label>
            </div>

            <div className="trainer-protected">
              <FiLock />

              <div>
                <small>
                  Employee ID
                </small>

                <b>
                  {profile
                    .employeeId ||
                    'Not available'}
                </b>
              </div>

              <div>
                <small>
                  National ID
                </small>

                <b>
                  {maskNationalId(
                    profile
                      .nationalId
                  )}
                </b>
              </div>

              <p>
                Protected data
                can only be
                changed by
                university
                administration.
              </p>
            </div>
          </FormSection>

          <FormSection
            number="3"
            title="Specializations & experience"
            subtitle="Add skills and employment history."
          >
            <div className="trainer-skill-edit">
              {draft.specializations.map(
                (item) => (
                  <span
                    key={
                      item.id
                    }
                  >
                    {item.name}

                    <button
                      onClick={() =>
                        set(
                          'specializations',
                          draft.specializations.filter(
                            (
                              current
                            ) =>
                              current.id !==
                              item.id
                          )
                        )
                      }
                    >
                      <FiX />
                    </button>
                  </span>
                )
              )}

              <input
                value={skill}
                placeholder="Add specialization"
                onChange={(
                  event
                ) =>
                  setSkill(
                    event
                      .target
                      .value
                  )
                }
              />

              <button
                onClick={() => {
                  if (
                    !skill.trim()
                  ) {
                    return;
                  }

                  set(
                    'specializations',
                    [
                      ...draft.specializations,

                      {
                        id: id(),
                        name:
                          skill.trim(),
                      },
                    ]
                  );

                  setSkill('');
                }}
              >
                <FiPlus />
              </button>
            </div>

            <RepeatEditor
              kind="experience"
              items={
                draft.experiences
              }
              onChange={(
                value
              ) =>
                set(
                  'experiences',
                  value
                )
              }
            />
          </FormSection>

          <FormSection
            number="4"
            title="Professional certificates"
            subtitle="Add certificates and verification links."
          >
            <RepeatEditor
              kind="certificate"
              items={
                draft.certificates
              }
              onChange={(
                value
              ) =>
                set(
                  'certificates',
                  value
                )
              }
            />
          </FormSection>

          <footer className="trainer-editor-footer">
            <button
              className="tp-secondary"
              onClick={
                cancel
              }
              disabled={
                saving
              }
            >
              Discard changes
            </button>

            <button
              className="tp-primary"
              onClick={save}
              disabled={
                saving
              }
            >
              <FiSave />

              {saving
                ? 'Saving...'
                : 'Save changes'}
            </button>
          </footer>
        </section>
      </div>
    );
  }

  const degreeText = [
    profile.academicDegree,
    profile.degreeSpecialization,
  ]
    .filter(Boolean)
    .join(' in ');

  return (
    <div className="trainer-profile-page">
      <header className="trainer-profile-title">
        <div>
          <span>
            TRAINER PROFILE
          </span>

          <h1>Profile</h1>

          <p>
            Personal,
            professional, and
            university
            information.
          </p>
        </div>

        <button
          className="tp-primary"
          onClick={() =>
            navigate(
              '/trainer-dashboard/profile/edit'
            )
          }
        >
          <FiEdit2 />

          Edit profile
        </button>
      </header>

      {error && (
        <div className="trainer-profile-error">
          {error}
        </div>
      )}

      <ProfileHero
        profile={profile}
      />

      <div className="trainer-profile-grid">
        <main>
          <Card
            title="Personal & professional information"
            icon={FiUser}
          >
            <div className="trainer-data-grid">
              <Data
                label="Full name"
                value={
                  profile.fullName
                    ? `Eng. ${profile.fullName}`
                    : ''
                }
              />

              <Data
                label="Job title"
                value={
                  profile.jobTitle
                }
              />

              <Data
                label="Email"
                value={
                  profile.email
                }
              />

              <Data
                label="Phone"
                value={
                  profile.phone
                }
              />

              <Data
                label="Employee ID"
                value={
                  profile.employeeId
                }
              />

              <Data
                label="National ID"
                value={maskNationalId(
                  profile.nationalId
                )}
              />

              <Data
                label="Experience"
                value={
                  profile.yearsOfExperience
                }
              />

              <Data
                label="Employment"
                value={
                  profile.employmentStatus
                }
              />
            </div>

            <div className="trainer-summary">
              <h3>
                Professional
                summary
              </h3>

              <p>
                {profile.bio ||
                  'No professional summary added.'}
              </p>

              <h3>
                Specializations
              </h3>

              <div className="trainer-tags">
                {profile.specializations.map(
                  (item) => (
                    <span
                      key={
                        item.id
                      }
                    >
                      {item.name}
                    </span>
                  )
                )}
              </div>
            </div>
          </Card>

          <Card
            title="Professional experience"
            icon={
              FiBriefcase
            }
          >
            <div className="trainer-timeline">
              {profile.experiences.map(
                (item) => (
                  <article
                    key={
                      item.id
                    }
                  >
                    <i />

                    <div>
                      <h3>
                        {item.role}
                      </h3>

                      <b>
                        {
                          item.organization
                        }
                      </b>

                      <small>
                        {item.from ||
                          '—'}{' '}
                        —{' '}
                        {item.to ||
                          '—'}
                      </small>

                      <p>
                        {
                          item.description
                        }
                      </p>
                    </div>
                  </article>
                )
              )}
            </div>
          </Card>

          <Card
            title="Professional certificates"
            icon={FiAward}
          >
            <div className="trainer-certificates">
              {profile.certificates.map(
                (item) => (
                  <article
                    key={
                      item.id
                    }
                  >
                    <FiAward />

                    <div>
                      <h3>
                        {item.name}
                      </h3>

                      <p>
                        {item.issuer ||
                          '—'}

                        {item.year
                          ? ` · ${item.year}`
                          : ''}
                      </p>
                    </div>

                    {item.verified && (
                      <span>
                        <FiCheckCircle />

                        Verified
                      </span>
                    )}

                    {item.verificationUrl && (
                      <a
                        href={
                          item.verificationUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FiExternalLink />
                      </a>
                    )}
                  </article>
                )
              )}
            </div>
          </Card>
        </main>

        <aside>
          <Card
            title="Academic information"
            icon={
              FiBookOpen
            }
          >
            <Academic
              icon={
                FiBookOpen
              }
              label="University"
              value={
                profile.university
              }
            />

            <Academic
              icon={FiAward}
              label="Faculty"
              value={
                profile.faculty
              }
            />

            <Academic
              icon={
                FiBriefcase
              }
              label="Department"
              value={
                profile.department
              }
            />

            <Academic
              icon={FiAward}
              label="University degree"
              value={
                degreeText
              }
            />

            <Academic
              icon={
                FiFileText
              }
              label="Certificate number"
              value={
                profile.degreeCertificateNumber
              }
            />

            <Academic
              icon={FiAward}
              label="Graduation year"
              value={
                profile.graduationYear
              }
            />
          </Card>

          <section className="trainer-degree">
            <FiFileText />

            <div>
              <small>
                UNIVERSITY
                CERTIFICATE
              </small>

              <h3>
                {profile
                  .degreeCertificate
                  ?.name ||
                  'No certificate uploaded'}
              </h3>

              <p>
                {profile
                  .degreeCertificate
                  ?.size ||
                  ''}
              </p>
            </div>

            {profile
              .degreeCertificate
              ?.verified && (
              <b>
                <FiCheckCircle />

                Verified
              </b>
            )}
          </section>

          <Card
            title="Contact & office"
            icon={FiMapPin}
          >
            <Academic
              icon={FiMapPin}
              label="Office"
              value={
                profile.office
              }
            />

            <Academic
              icon={
                FiBriefcase
              }
              label="Office hours"
              value={
                profile.officeHours
              }
            />

            <Academic
              icon={FiPhone}
              label="Extension"
              value={
                profile.extension
              }
            />

            <div className="trainer-links">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                >
                  <FiMail />
                  Email
                </a>
              )}

              {profile.github && (
                <a
                  href={
                    profile.github
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiGithub />
                  GitHub
                </a>
              )}

              {profile.linkedin && (
                <a
                  href={
                    profile.linkedin
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiLinkedin />
                  LinkedIn
                </a>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ProfileHero({
  profile,
  editing,
}) {
  const location = [
    profile.department,
    profile.university,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="trainer-profile-hero">
      <img
        src={
          profile.avatar ||
          avatar(
            profile.fullName
          )
        }
        alt={
          profile.fullName
        }
      />

      <div>
        <h2>
          Eng.{' '}
          {profile.fullName ||
            'Trainer'}
        </h2>

        <span>
          <FiCheckCircle />

          {profile.status ===
          'active'
            ? 'Active'
            : 'Inactive'}

          {' · '}

          {profile.isVerified
            ? 'Verified'
            : 'Not verified'}
        </span>

        <p>
          {profile.jobTitle ||
            '—'}
        </p>

        <small>
          {location || '—'}
        </small>
      </div>

      {editing && (
        <b>
          <FiEdit2 />

          Editing profile
        </b>
      )}
    </section>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}) {
  return (
    <section className="trainer-profile-card">
      <header>
        <h2>{title}</h2>

        <Icon />
      </header>

      {children}
    </section>
  );
}

function Data({
  label,
  value,
}) {
  return (
    <div className="trainer-data">
      <small>
        {label}
      </small>

      <b>
        {value || '—'}
      </b>
    </div>
  );
}

function Academic({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="trainer-academic">
      <span>
        <Icon />
      </span>

      <div>
        <small>
          {label}
        </small>

        <b>
          {value || '—'}
        </b>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  change,
  area,
  type = 'text',
  full,
}) {
  return (
    <label
      className={`trainer-field ${
        full
          ? 'full'
          : ''
      }`}
    >
      <span>
        {label}
      </span>

      {area ? (
        <textarea
          value={
            value || ''
          }
          onChange={(
            event
          ) =>
            change(
              event.target.value
            )
          }
        />
      ) : (
        <input
          type={type}
          value={
            value || ''
          }
          onChange={(
            event
          ) =>
            change(
              event.target.value
            )
          }
        />
      )}
    </label>
  );
}

function FormSection({
  number,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="trainer-form-section">
      <header>
        <span>
          {number}
        </span>

        <div>
          <h2>
            {title}
          </h2>

          <p>
            {subtitle}
          </p>
        </div>
      </header>

      {children}
    </section>
  );
}

function RepeatEditor({
  kind,
  items,
  onChange,
}) {
  const exp =
    kind ===
    'experience';

  const update = (
    itemId,
    data
  ) => {
    onChange(
      items.map(
        (item) =>
          item.id ===
          itemId
            ? {
                ...item,
                ...data,
              }
            : item
      )
    );
  };

  const add = () => {
    onChange([
      ...items,

      exp
        ? {
            id: id(),

            role: '',

            organization:
              '',

            from: '',

            to: '',

            description:
              '',
          }
        : {
            id: id(),

            name: '',

            issuer: '',

            year: '',

            verificationUrl:
              '',

            verified:
              false,
          },
    ]);
  };

  return (
    <div className="trainer-repeat">
      <button
        className="trainer-add"
        onClick={add}
      >
        <FiPlus />

        Add {kind}
      </button>

      {items.map(
        (item) => (
          <article
            key={item.id}
          >
            <div className="trainer-fields">
              {exp ? (
                <>
                  <Field
                    label="Role"
                    value={
                      item.role
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          role:
                            value,
                        }
                      )
                    }
                  />

                  <Field
                    label="Organization"
                    value={
                      item.organization
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          organization:
                            value,
                        }
                      )
                    }
                  />

                  <Field
                    label="From"
                    value={
                      item.from
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          from:
                            value,
                        }
                      )
                    }
                  />

                  <Field
                    label="To"
                    value={
                      item.to
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          to:
                            value,
                        }
                      )
                    }
                  />

                  <Field
                    full
                    area
                    label="Description"
                    value={
                      item.description
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          description:
                            value,
                        }
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Certificate"
                    value={
                      item.name
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          name:
                            value,
                        }
                      )
                    }
                  />

                  <Field
                    label="Issuer"
                    value={
                      item.issuer
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          issuer:
                            value,
                        }
                      )
                    }
                  />

                  <Field
                    label="Year"
                    value={
                      item.year
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          year:
                            value,
                        }
                      )
                    }
                  />

                  <Field
                    label="Verification URL"
                    value={
                      item.verificationUrl
                    }
                    change={(
                      value
                    ) =>
                      update(
                        item.id,
                        {
                          verificationUrl:
                            value,
                        }
                      )
                    }
                  />
                </>
              )}
            </div>

            <button
              className="trainer-delete"
              onClick={() =>
                window.confirm(
                  `Delete this ${kind}?`
                ) &&
                onChange(
                  items.filter(
                    (
                      current
                    ) =>
                      current.id !==
                      item.id
                  )
                )
              }
            >
              <FiTrash2 />
            </button>
          </article>
        )
      )}
    </div>
  );
}