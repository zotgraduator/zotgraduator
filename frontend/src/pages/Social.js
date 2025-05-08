import React, { useState, useEffect } from 'react';
import '../styles/Social.css';

function Social() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Fetch posts from the backend API (mocked for now)
    const mockPosts = [
      {
        id: 1,
        user: {
          name: 'John Doe',
          major: 'Computer Science',
          year: 'Senior',
          bio: 'CS major | Peer Academic Advisor',
        },
        plan: {
          years: 4,
          courses: ['CS 161', 'CS 171', 'IN4MATX 115'],
        },
        caption:
          'This schedule got me through double majoring with a part-time job 😅',
        likes: 12,
        comments: [
          { user: 'Jane Smith', text: 'This is so helpful, thank you!' },
        ],
      },
    ];
    setPosts(mockPosts);
  }, []);

  return (
    <div className="social-page">
      <h1>ZotConnect</h1>
      <div className="feed">
        {posts.map((post) => (
          <div key={post.id} className="post">
            <div className="user-info">
              <h3>{post.user.name}</h3>
              <p>
                {post.user.major} | {post.user.year}
              </p>
              <p>{post.user.bio}</p>
            </div>
            <div className="plan-info">
              <h4>Plan ({post.plan.years} years):</h4>
              <ul>
                {post.plan.courses.map((course, index) => (
                  <li key={index}>{course}</li>
                ))}
              </ul>
            </div>
            <p className="caption">{post.caption}</p>
            <div className="interactions">
              <button>👍 {post.likes}</button>
              <button>💬 {post.comments.length}</button>
            </div>
            <div className="comments">
              {post.comments.map((comment, index) => (
                <p key={index}>
                  <strong>{comment.user}:</strong> {comment.text}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Social;
