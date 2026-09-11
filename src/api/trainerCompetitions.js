const getTrainerToken = () => {
  return (
    localStorage.getItem('trainer_token') ||
    sessionStorage.getItem('trainer_token')
  );
};

async function trainerCompetitionRequest(
  endpoint,
  options = {}
) {
  const token = getTrainerToken();

  if (!token) {
    throw new Error(
      'No trainer authentication token found.'
    );
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const validationError = data.errors
      ? Object.values(data.errors).flat()[0]
      : null;

    throw new Error(
      validationError ||
        data.message ||
        'Unable to complete the request.'
    );
  }

  return data;
}

const jsonOptions = (method, payload) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

export function getTrainerCompetitions() {
  return trainerCompetitionRequest(
    '/trainer/competitions'
  );
}

export function getTrainerCompetition(
  competitionId
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}`
  );
}

export function createTrainerCompetition(payload) {
  return trainerCompetitionRequest(
    '/trainer/competitions',
    jsonOptions('POST', payload)
  );
}

export function updateTrainerCompetition(
  competitionId,
  payload
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}`,
    jsonOptions('PUT', payload)
  );
}

export function deleteTrainerCompetition(
  competitionId
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}`,
    {
      method: 'DELETE',
    }
  );
}

export function updateTrainerCompetitionStatus(
  competitionId,
  status
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/status`,
    jsonOptions('PATCH', { status })
  );
}

export function getTrainerCompetitionRegistrations(
  competitionId
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/registrations`
  );
}

export function approveTrainerCompetitionRegistration(
  competitionId,
  registrationId
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/registrations/${registrationId}/approve`,
    {
      method: 'PATCH',
    }
  );
}

export function rejectTrainerCompetitionRegistration(
  competitionId,
  registrationId,
  reason
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/registrations/${registrationId}/reject`,
    jsonOptions('PATCH', { reason })
  );
}

export function disqualifyTrainerCompetitionRegistration(
  competitionId,
  registrationId,
  reason
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/registrations/${registrationId}/disqualify`,
    jsonOptions('PATCH', { reason })
  );
}

export function getTrainerCompetitionSubmissions(
  competitionId
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/submissions`
  );
}

export function getTrainerCompetitionSubmission(
  competitionId,
  submissionId
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/submissions/${submissionId}`
  );
}

export function reviewTrainerCompetitionSubmission(
  competitionId,
  submissionId,
  payload
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/submissions/${submissionId}/review`,
    jsonOptions('PATCH', payload)
  );
}

export function scoreTrainerCompetitionSubmission(
  competitionId,
  submissionId,
  payload
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/submissions/${submissionId}/score`,
    jsonOptions('PUT', payload)
  );
}

export function getTrainerCompetitionResults(
  competitionId
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/results`
  );
}

export function publishTrainerCompetitionResults(
  competitionId,
  awards = []
) {
  return trainerCompetitionRequest(
    `/trainer/competitions/${competitionId}/results/publish`,
    jsonOptions('POST', { awards })
  );
}