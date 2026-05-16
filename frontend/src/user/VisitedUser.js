import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../api/axios";
import DisplayVisitedUserPosts from "../components/displayPosts/DisplayVisitedUserPosts";
import { usePosts } from "../context/PostsContext";

export default function VisitedUser() {
  const { visitedUserId } = useParams(); // Get the user ID from the URL
  const [user, setUser] = useState(null); // Store user data
  const [loading, setLoading] = useState(true); // Store user data

  const nav = useNavigate();
  const { addPostsToSection } = usePosts();
  // Fetch user data and posts
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch user details
        const res = await api.get(`users/${visitedUserId}`);
        const posts = res.data.posts;
        if (!res.error) {
          setUser(res.data.user);
          addPostsToSection(posts, "currentVisitedUser", { replace: true });
        } else {
          console.error("Failed to fetch user:", res.message);
          nav("/not-found", { replace: true }); // Redirect if user not found
        }
      } catch (error) {
        console.error("An error occurred:", error);
      } finally {
        setLoading(false); // Stop loading
      }
    }

    fetchUserData();
  }, [visitedUserId, nav]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container-c'>
      {/* User Info */}
      <div className='flex items-center gap-4 mt-10 mb-8'>
        <img
          src={user?.avatar}
          alt={`${user?.username}'s avatar`}
          className='w-16 h-16 rounded-full object-cover'
        />
        <h1 className='text-4xl font-bold'>{user?.username}</h1>
      </div>
      <div>{user?.description}</div>

      {/* User Posts */}
      <DisplayVisitedUserPosts
        loading={loading}
        type='view'
      />
    </div>
  );
}
