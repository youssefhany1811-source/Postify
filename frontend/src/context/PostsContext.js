import React, { createContext, useContext, useState } from "react";

const postsContext = createContext();

export function PostsProvider({ children }) {
  const [allPosts, setAllPosts] = useState({
    byId: {},
    home: { allIds: [] },
    history: { allIds: [] },
    saved: { allIds: [] },
    currentVisitedUser: { allIds: [] },
  });

  const [loadHomePosts, setLoadHomePosts] = useState(true);
  const [hasFetchedHomePosts, setHasFetchedHomePosts] = useState(false);
  const [homeCurrentPage, setHomeCurrentPage] = useState(1);
  const [homeLastPage, setHomeLastPage] = useState();
  const [loadHistoryPosts, setLoadHistoryPosts] = useState(true);
  const [loadSavedPosts, setLoadSavedPosts] = useState(true);

  function addPostsToSection(posts, section, options = {}) {
    const { prepend = false, replace = false } = options;

    setAllPosts((prev) => {
      const normalizedPosts = posts.filter((post) => post?.id != null);
      const incomingIds = normalizedPosts.map((post) => post.id);
      const newById = { ...prev.byId };

      normalizedPosts.forEach((post) => {
        const oldPost = prev.byId[post.id];
        newById[post.id] = { ...oldPost, ...post };
      });

      const currentAllIds = prev[section]?.allIds ?? [];
      let allIds = [];

      if (replace) {
        allIds = [...new Set(incomingIds)];
      } else if (prepend) {
        allIds = [...new Set([...incomingIds, ...currentAllIds])];
      } else {
        allIds = [...new Set([...currentAllIds, ...incomingIds])];
      }

      return {
        ...prev,
        byId: newById,
        [section]: {
          allIds,
        },
      };
    });
  }

  function prependPostToSection(post, section) {
    addPostsToSection([post], section, { prepend: true });
  }

  function deletePost(postId) {
    setAllPosts((prev) => {
      const newById = { ...prev.byId };
      delete newById[postId];

      const newState = { ...prev, byId: newById };

      Object.keys(newState).forEach((key) => {
        if (key !== "byId" && newState[key]?.allIds) {
          newState[key] = {
            ...newState[key],
            allIds: newState[key].allIds.filter((id) => id !== postId),
          };
        }
      });

      return newState;
    });
  }

  function toggleSavedPostState(postId) {
    setAllPosts((prev) => {
      const existingPost = prev.byId[postId];
      if (!existingPost) return prev;

      const newSavedPostsIds = prev.saved.allIds.filter(
        (currPId) => currPId !== postId
      );

      const updatedPost = {
        ...existingPost,
        is_saved: !existingPost.is_saved,
      };

      return {
        ...prev,
        saved: {
          allIds: newSavedPostsIds,
        },
        byId: {
          ...prev.byId,
          [postId]: updatedPost,
        },
      };
    });
  }

  function updatePost(updatedPost) {
    const id = updatedPost?.id;
    if (!id) return;

    setAllPosts((prev) => {
      const prevPost = prev.byId[id] ?? {};
      return {
        ...prev,
        byId: {
          ...prev.byId,
          [id]: { ...prevPost, ...updatedPost },
        },
      };
    });
  }

  return (
    <postsContext.Provider
      value={{
        updatePost,
        deletePost,
        setAllPosts,
        toggleSavedPostState,
        addPostsToSection,
        prependPostToSection,
        allPosts,
        loadHomePosts,
        setLoadHomePosts,
        hasFetchedHomePosts,
        setHasFetchedHomePosts,
        loadHistoryPosts,
        setLoadHistoryPosts,
        loadSavedPosts,
        setLoadSavedPosts,
        homeCurrentPage,
        setHomeCurrentPage,
        homeLastPage,
        setHomeLastPage,
      }}
    >
      {children}
    </postsContext.Provider>
  );
}

export const usePosts = () => useContext(postsContext);
