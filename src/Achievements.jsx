import { useEffect, useState } from 'react';
import {
  addStudentCredential,
  deleteStudentCredential,
  getStudentAchievements,
} from './api/studentAchievements';
import PortfolioView from './PortfolioView';
import './Achievements.css';

function Achievements() {
  const [portfolio, setPortfolio] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] =
    useState('');
  const [credentialSaving, setCredentialSaving] =
    useState(false);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError('');

      const data =
        await getStudentAchievements();

      setPortfolio(data.portfolio || null);
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load your portfolio.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const addCredential = async (payload) => {
    try {
      setCredentialSaving(true);
      setActionError('');

      await addStudentCredential(payload);
      await loadPortfolio();
    } catch (requestError) {
      setActionError(
        requestError.message ||
          'Unable to add certificate.'
      );
      throw requestError;
    } finally {
      setCredentialSaving(false);
    }
  };

  const deleteCredential = async (
    credentialId
  ) => {
    try {
      setCredentialSaving(true);
      setActionError('');

      await deleteStudentCredential(
        credentialId
      );

      await loadPortfolio();
    } catch (requestError) {
      setActionError(
        requestError.message ||
          'Unable to delete certificate.'
      );
      throw requestError;
    } finally {
      setCredentialSaving(false);
    }
  };

  if (loading && !portfolio) {
    return (
      <main className="career-portfolio">
        <div className="portfolio-empty">
          <div>
            <h3>
              Loading your career portfolio...
            </h3>
            <p>
              Verified records are being loaded
              from Compass Academy.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !portfolio) {
    return (
      <main className="career-portfolio">
        <div className="portfolio-empty">
          <div>
            <h3>
              Unable to load your portfolio
            </h3>
            <p>{error}</p>

            <button
              type="button"
              className="portfolio-add-button"
              onClick={loadPortfolio}
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PortfolioView
      portfolio={portfolio}
      onAddCredential={addCredential}
      onDeleteCredential={deleteCredential}
      credentialSaving={credentialSaving}
      actionError={actionError}
    />
  );
}

export default Achievements;
