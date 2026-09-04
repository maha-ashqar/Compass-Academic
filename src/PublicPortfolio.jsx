import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPortfolio } from './api/studentAchievements';
import PortfolioView from './PortfolioView';
import './Achievements.css';

function PublicPortfolio() {
  const { portfolioCode } = useParams();
  const [portfolio, setPortfolio] =
    useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getPublicPortfolio(
          portfolioCode
        );

        setPortfolio(data.portfolio || null);
      } catch (requestError) {
        setError(
          requestError.message ||
            'Portfolio not found.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [portfolioCode]);

  if (loading) {
    return (
      <main
        className="career-portfolio"
        style={{
          margin: '40px auto',
          padding: '0 20px',
        }}
      >
        <div className="portfolio-empty">
          <div>
            <h3>Loading portfolio...</h3>
            <p>
              Fetching verified Compass Academy
              records.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !portfolio) {
    return (
      <main
        className="career-portfolio"
        style={{
          margin: '40px auto',
          padding: '0 20px',
        }}
      >
        <div className="portfolio-empty">
          <div>
            <h3>Portfolio not found</h3>
            <p>
              {error ||
                'This portfolio is unavailable.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div
      style={{
        padding: '30px 20px',
        background: '#f5f8fb',
        minHeight: '100vh',
      }}
    >
      <PortfolioView
        portfolio={portfolio}
        isPublic
      />
    </div>
  );
}

export default PublicPortfolio;
