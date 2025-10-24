import React from 'react';
import './WelcomeScreen.css';
import { useLessonStore } from '../../../lib/state';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

// Mock lesson data - will be replaced with real data
const LESSONS = [
  {
    id: 'equal-parts-challenge',
    title: 'The Equal Parts Challenge',
    icon: '🍪',
    grade: '3rd Grade',
    duration: '20 min',
    color: '#FF6B9D',
  },
  {
    id: 'fractions-3-nf-a-1',
    title: 'Understanding One Half',
    icon: '🍫',
    grade: '3rd Grade',
    duration: '15 min',
    color: '#C084FC',
  },
  {
    id: 'fractions-basic-2',
    title: 'Dividing Pizza Slices',
    icon: '🍕',
    grade: '3rd Grade',
    duration: '12 min',
    color: '#FFA07A',
  },
  {
    id: 'fractions-basic-3',
    title: 'Fair Sharing Game',
    icon: '🎂',
    grade: '3rd Grade',
    duration: '18 min',
    color: '#FFD700',
  },
  {
    id: 'fractions-basic-4',
    title: 'Comparing Fraction Sizes',
    icon: '⚖️',
    grade: '3rd Grade',
    duration: '20 min',
    color: '#98D8C8',
  },
  {
    id: 'fractions-basic-5',
    title: 'Building Fraction Bars',
    icon: '📊',
    grade: '4th Grade',
    duration: '16 min',
    color: '#9B88FF',
  },
];

const LessonThumbnail: React.FC<{ icon: string; color: string }> = ({ icon, color }) => (
  <div className="lesson-thumbnail" style={{ backgroundColor: color + '20' }}>
    <div className="lesson-thumbnail-bg" style={{ backgroundColor: color }} />
    <span className="lesson-thumbnail-icon">{icon}</span>
  </div>
);

const LessonCard: React.FC<{
  lesson: typeof LESSONS[0];
  onClick: () => void;
}> = ({ lesson, onClick }) => {
  return (
    <div className="lesson-card" onClick={onClick}>
      <div className="lesson-card-thumbnail">
        <LessonThumbnail icon={lesson.icon} color={lesson.color} />
      </div>
      <div className="lesson-card-content">
        <h3 className="lesson-card-title">{lesson.title}</h3>
        <div className="lesson-card-meta">
          <span>{lesson.grade}</span>
          <span>•</span>
          <span>{lesson.duration}</span>
        </div>
      </div>
    </div>
  );
};

const WelcomeScreen: React.FC = () => {
  const { loadLesson } = useLiveAPIContext();
  const { currentLesson } = useLessonStore();

  const handleStartLesson = (lessonId: string) => {
    console.log('[WelcomeScreen] 📚 Starting lesson:', lessonId);
    loadLesson(lessonId);
    console.log('[WelcomeScreen] ✅ Lesson ready! Click Connect to begin.');
  };

  // Featured lesson: Use current lesson if loaded, otherwise default to first
  const featuredLesson = currentLesson 
    ? LESSONS.find(l => l.id === currentLesson.id) || LESSONS[0]
    : LESSONS[0];

  // Playlist: All lessons except the featured one
  const playlistLessons = LESSONS.filter(l => l.id !== featuredLesson.id);

  return (
    <div className="welcome-screen">
      {/* Featured Lesson */}
      <div className="featured-lesson-card">
        {currentLesson && (
          <div className="status-badge playing">
            ✓ NOW PLAYING
          </div>
        )}
        
        <div className="featured-grid">
          <div>
            <h1 className="featured-title">{featuredLesson.title}</h1>
            <div className="featured-meta">
              <span>📚 {featuredLesson.grade}</span>
              <span>•</span>
              <span>⏱️ {featuredLesson.duration}</span>
            </div>
            <button
              className="clean-button"
              onClick={() => handleStartLesson(featuredLesson.id)}
            >
              ▶ Start Adventure
            </button>
          </div>

          <div style={{ width: '100%', maxWidth: '500px' }}>
            <LessonThumbnail icon={featuredLesson.icon} color={featuredLesson.color} />
          </div>
        </div>
      </div>

      {/* Lesson Playlist */}
      <div className="lesson-cards-container">
        <h2 className="section-title">Up Next</h2>
        <div className="lesson-cards-scroll">
          {playlistLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onClick={() => handleStartLesson(lesson.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
