import Projects from './Projects';

// Compatibility wrapper: the student dashboard and any legacy imports now use
// the same project gallery, wizard, drafts, and review workflow.
const ProjectsGallery = ({ studentData }) => (
  <Projects studentData={studentData} />
);

export default ProjectsGallery;
