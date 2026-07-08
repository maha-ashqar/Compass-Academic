import Sidebar from './Sidebar'; // الاستيراد موجود
import { Outlet } from 'react-router-dom';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-wrapper">
      <aside className="fixed-sidebar">
        {/* التعديل هنا: أضيفي المكون بهذا الشكل */}
        <Sidebar /> 
      </aside>
      <main className="content-area">
        <Outlet /> 
      </main>
    </div>
  );
};

export default DashboardLayout;