import React, { useEffect, useState } from "react";
import DisplayHistoryOrSavedPosts from "../../components/displayPosts/DisplayHistoryOrSavedPosts";
import { useLocation } from "react-router";
import { usePosts } from "../../context/PostsContext";
import api from "../../api/axios";
function History() {
  const { addPostsToSection, loadHistoryPosts, setLoadHistoryPosts } =
    usePosts();
  const [likesCount, setLikesCount] = useState(null);

  const loc = useLocation();
  console.log(loc);

  useEffect(() => {
    async function getPosts() {
      setLoadHistoryPosts(true);
      let res = await api.get("user/posts");
      if (!res.error) {
        let posts = res.data.posts;
        setLikesCount(res.data.likes_count);
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
        pageTitle={"History"}
        type={"edit"}
      />
    </div>
  );
}

export default History;
