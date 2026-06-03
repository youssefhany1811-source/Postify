import React, { useEffect } from "react";
import DisplayHistoryOrSavedPosts from "../../components/displayPosts/DisplayHistoryOrSavedPosts";
import { useLocation } from "react-router";
import { usePosts } from "../../context/PostsContext";
import api from "../../api/axios";
function History() {
  const { addPostsToSection, loadHistoryPosts, setLoadHistoryPosts } =
    usePosts();

  const loc = useLocation();
  console.log(loc);

  useEffect(() => {
    async function getPosts() {
      setLoadHistoryPosts(true);
      let res = await api.get("user/posts");
      if (!res.error) {
        let posts = res.data.posts;
        addPostsToSection(posts, "history", { replace: true });
      }

      setLoadHistoryPosts(false);
    }
    getPosts();
  }, []);
  return (
    <div className='container-c'>
      <DisplayHistoryOrSavedPosts
        loading={loadHistoryPosts}
        pageTitle={"My Reports"}
        type={"edit"}
      />
    </div>
  );
}

export default History;
