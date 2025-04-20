import React from 'react';
import '../styles/AboutUs.css';
import jasper from '../images/jasper.png';
import connor from '../images/connor.png';
import jake from '../images/jake.png';
import sierra from '../images/sierra.png';

function AboutUs() {
  const teamMembers = [
    {
      id: 1,
      name: 'Jasper D',
      image: jasper,
      role: 'Project Manager',
      description: 'Creator of the original course planning optimizer that inspired Zotgraduator.',
      github: 'https://github.com/jasperdoan',
      linkedin: 'https://www.linkedin.com/in/jasperdoan/'
    },
    {
      id: 2,
      name: 'Connor D',
      image: connor,
      role: 'Frontend Developer',
      description: 'Specialized in building intuitive user interfaces and seamless user experiences.',
      github: 'https://github.com/connor-darling',
      linkedin: 'https://www.linkedin.com/in/connor-darling-206a05238/'
    },
    {
      id: 3,
      name: 'Jake C',
      image: jake,
      role: 'Product Owner',
      description: 'Focused on product vision and ensuring the team meets user needs.',
      github: 'https://github.com/CakeJamble',
      linkedin: 'https://www.linkedin.com/in/jacobcampbelllogan/'
    },
    {
      id: 4,
      name: 'SIERRA M',
      image: sierra,
      role: 'Backend Developer',
      description: 'Expert in database design and optimization algorithms.',
      github: 'https://github.com/mcdipples',
      linkedin: 'https://www.linkedin.com/in/sierrasusmartin/'
    }
  ];

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-container">
          <h1>ZOTGRADUATOR</h1>
          <p className="lead">
          Your path to graduation, simplified.
          </p>
        </div>
      </div>

      <section className="about-mission">
        <div className="about-container">
          <h2>About Zotgraduator</h2>
          <div className="mission-content">
            <div className="mission-text">
              <p>
                We're dedicated to solving one of the most challenging aspects of college life: 
                planning your academic path. Our platform empowers UCI students to make informed decisions about 
                their course selections, ensuring they meet graduation requirements while balancing personal 
                interests and career goals.
              </p>
              <p>
                Using our algorithm, we create directed acyclic graphs that prevent class conflicts while considering 
                prerequisites, corequisites, and unit requirements to map out your entire academic journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-team">
        <div className="about-container">
          <h2>Meet Our Team</h2>
          <p className="team-intro">
            We are a group of Senior Software Engineering students from the Donald Bren School of 
            Information and Computer Sciences at the University of California, Irvine.
          </p>
          
          <div className="team-grid">
            {teamMembers.map(member => (
              <div key={member.id} className="team-member">
                <div className="member-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <h3>{member.name}</h3>
                <p className="member-role">{member.role}</p>
                <p className="member-bio">{member.description}</p>
                <div className="member-links">
                  <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s GitHub`}>
                    <i className="fab fa-github"></i>
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s LinkedIn`}>
                    <i className="fab fa-linkedin"></i>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-story">
        <div className="about-container">
          <h2>Our Story</h2>
          <div className="story-content">
            <p>
              Zotgraduator was born from a side project created by Jasper, who developed a course plan 
              optimizer that uses algorithmic techniques to build optimal academic schedules. By scraping yearly 
              course offerings and analyzing prerequisites, the tool creates personalized 4-year plans that 
              minimize conflicts and maximize efficiency.
            </p>
            <p>
              This project was further developed through UCI's Internet Applications Engineering course 
              (IN4MATX 124), where we expanded the concept into a full-fledged web application. The course 
              covered essential web technologies such as HTTP, REST, Remote Procedure Calls, Web Services, 
              data representations, content distribution networks, and identity management.
            </p>
            <p>
              As students ourselves, we understand the frustrations of course planning and have experienced 
              firsthand how challenging it can be to balance requirements, preferences, and availability. 
              Zotgraduator is our solution to this universal student problem, designed by students, for students.
            </p>
          </div>
        </div>
      </section>

      <section className="about-school">
        <div className="about-container">
          <h2>Donald Bren School of Information and Computer Sciences</h2>
          <p>
            We are proud to be students at UC Irvine's Donald Bren School of Information and Computer Sciences, 
            the only computing-focused school in the University of California system. The school is known for 
            its innovative approach to education and research in the fields of computer science, informatics, 
            and statistics.
          </p>
          <p>
            <a href="https://www.ics.uci.edu/" target="_blank" rel="noopener noreferrer" className="school-link">
              Learn more about the Donald Bren School of ICS
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
