import React from 'react';
import './WelcomeScreen.css';
import { useLessonStore } from '../../../lib/state';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

// Mock lesson data - will be replaced with real data
const LESSONS = [
  {
    id: 'fractions-3-nf-a-1',
    title: 'Understanding One Half',
    icon: '🍫',
    grade: '3rd Grade',
    duration: '15 min',
    color: '#FF6B9D',
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
  <div style={{
    width: '100%',
    aspectRatio: '16/9',
    background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '64px',
    border: `2px solid ${color}60`,
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Background pattern */}
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `radial-gradient(circle at 30% 30%, ${color}30 0%, transparent 60%)`,
    }} />
    <span style={{ position: 'relative', zIndex: 1 }}>{icon}</span>
  </div>
);

const LessonCard: React.FC<{
  lesson: typeof LESSONS[0];
  onClick: () => void;
  isHero?: boolean;
}> = ({ lesson, onClick, isHero = false }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (isHero) {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'rgba(45, 50, 80, 0.4)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '2px solid rgba(255, 229, 180, 0.3)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered 
            ? '0 20px 60px rgba(26, 29, 46, 0.8)' 
            : '0 12px 40px rgba(26, 29, 46, 0.6)',
        }}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.5fr 1fr',
          gap: '32px',
          padding: '40px',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: 'rgba(255, 179, 102, 0.2)',
              border: '1px solid rgba(255, 179, 102, 0.4)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#FFE5B4',
              fontWeight: '600',
              marginBottom: '16px',
            }}>
              🌟 Continue Learning
            </div>
            <h2 style={{
              fontSize: '36px',
              color: '#FFE5B4',
              marginBottom: '12px',
              fontWeight: 'bold',
            }}>
              {lesson.title}
            </h2>
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#B8B5B0',
            }}>
              <span>📚 {lesson.grade}</span>
              <span>•</span>
              <span>⏱️ {lesson.duration}</span>
            </div>
            <button
              onClick={onClick}
              style={{
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#1A1D2E',
                backgroundColor: '#FFB366',
                border: '3px solid rgba(255, 179, 102, 0.6)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 8px 24px rgba(255, 179, 102, 0.4)',
              }}
            >
              ▶ Start Adventure
            </button>
          </div>
          <LessonThumbnail icon={lesson.icon} color={lesson.color} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: '280px',
        background: 'rgba(45, 50, 80, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '2px solid rgba(255, 229, 180, 0.2)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered 
          ? '0 16px 48px rgba(26, 29, 46, 0.7)' 
          : '0 8px 24px rgba(26, 29, 46, 0.5)',
      }}
    >
      <div style={{ padding: '12px' }}>
        <LessonThumbnail icon={lesson.icon} color={lesson.color} />
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontSize: '16px',
          color: '#E8E6E3',
          marginBottom: '8px',
          fontWeight: '600',
          lineHeight: '1.3',
        }}>
          {lesson.title}
        </h3>
        <div style={{
          display: 'flex',
          gap: '8px',
          fontSize: '12px',
          color: '#B8B5B0',
          flexWrap: 'wrap',
        }}>
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
    <div className="welcome-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      padding: '48px',
      overflowY: 'auto',
      height: '100%',
    }}>
      {/* ROW 1: CURRENT LESSON - YouTube-style large player */}
      <div style={{
        background: 'rgba(45, 50, 80, 0.4)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '2px solid rgba(255, 229, 180, 0.3)',
        padding: '48px 56px',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: '0 12px 40px rgba(26, 29, 46, 0.6)',
      }}>
        {currentLesson && (
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'rgba(136, 212, 171, 0.2)',
            border: '2px solid rgba(136, 212, 171, 0.4)',
            borderRadius: '10px',
            marginBottom: '32px',
            alignSelf: 'flex-start',
          }}>
            <span style={{ fontSize: '14px', color: '#88D4AB', fontWeight: '700', letterSpacing: '0.5px' }}>
              ✓ NOW PLAYING
            </span>
          </div>
        )}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.2fr 1fr',
          gap: '64px',
          alignItems: 'center',
        }}>
          {/* Left: Lesson Info */}
          <div>
            <h1 style={{
              fontSize: '56px',
              color: '#FFE5B4',
              marginBottom: '24px',
              fontWeight: 'bold',
              lineHeight: '1.1',
            }}>
              {featuredLesson.title}
            </h1>
            <div style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '48px',
              fontSize: '18px',
              color: '#B8B5B0',
            }}>
              <span>📚 {featuredLesson.grade}</span>
              <span>•</span>
              <span>⏱️ {featuredLesson.duration}</span>
            </div>
            <button
              onClick={() => handleStartLesson(featuredLesson.id)}
              style={{
                padding: '24px 56px',
                fontSize: '22px',
                fontWeight: 'bold',
                color: '#1A1D2E',
                backgroundColor: '#FFB366',
                border: '3px solid rgba(255, 179, 102, 0.6)',
                borderRadius: '18px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 10px 32px rgba(255, 179, 102, 0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFC080';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFB366';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              ▶ Start Adventure
            </button>
          </div>

          {/* Right: Thumbnail - Larger */}
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <LessonThumbnail icon={featuredLesson.icon} color={featuredLesson.color} />
          </div>
        </div>
      </div>

      {/* ROW 2: PLAYLIST */}
      <div style={{
        background: 'rgba(45, 50, 80, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '2px solid rgba(255, 229, 180, 0.2)',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(26, 29, 46, 0.5)',
      }}>
        <h2 style={{
          fontSize: '20px',
          color: '#FFE5B4',
          marginBottom: '20px',
          fontWeight: '600',
        }}>
          Up Next
        </h2>
        <div style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 229, 180, 0.3) transparent',
        }}>
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
