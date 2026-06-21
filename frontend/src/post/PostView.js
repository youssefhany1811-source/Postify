import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TextareaAutosize } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import api from "../api/axios";
import CommentsLayout from "../components/comment/CommentsLayout";
import PostLikeBtn from "../components/PostLikeBtn";

function PostView() {
  const { id: postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const user = JSON.parse(localStorage.getItem("user"));
  const isGizaEntity = user?.user_role === "entity_giza";

  useEffect(() => {
    async function getPost() {
      try {
        const endpoint = isGizaEntity
          ? `entity/giza/reports/${postId}`
          : `reports/${postId}`;
        const res = await api.get(endpoint);
        setPost(res.data.post);
        setComments(res.data.comments);
        setIsLiked(res.data.post.liked);
        setLikesCount(res.data.post.supports_count ?? res.data.post.likes_count);
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    }
    getPost();
  }, [postId, isGizaEntity]);

  async function addComment(text) {
    if (!text.trim()) return;

    try {
      const res = await api.post(`reports/${postId}/comments`, { body: text });
      const newComment = {
        ...res.data.comment,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
      };
      console.log("New comment added:", newComment);

      setComments((prev) => [...prev, newComment]);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  }

  async function handlePostLike() {
    const postId = post.id;
    setIsLiked((prev) => !prev);

    try {
      let res = await api.post(`reports/${postId}/support`);
      if (!res.data.liked) {
        setIsLiked(false);
        setLikesCount((prev) => Math.max(prev - 1, 0));
      } else {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.log("Error:", error);
    }
  }

  if (!post) {
    return (
      <div className='container-c'>
        <Skeleton
          variant='rectangular'
          style={{ height: "50px", marginBottom: "50px" }}
        />
        <Skeleton variant='rectangular' style={{ height: "300px" }} />
      </div>
    );
  }

  return (
      <div className='container-c'>
      <div className='mb-5 flex flex-wrap gap-2 text-sm text-slate-200'>
        {post?.category && (
          <span className='report-meta-chip bg-cyan-800/60'>
            {post.category.replaceAll("_", " ")}
          </span>
        )}
        {post?.status && (
          <span className='report-meta-chip bg-emerald-800/60'>
            {post.status.replaceAll("_", " ")}
          </span>
        )}
        {post?.location && (
          <span className='report-meta-chip bg-slate-700/80'>
            {post.location}
          </span>
        )}
        {post?.contact_phone && (
          <span className='report-meta-chip bg-slate-700/80'>
            phone: {post.contact_phone}
          </span>
        )}
      </div>
      <div>
        <TextareaAutosize
          value={post?.title}
          disabled
          placeholder='Title'
          className='h-[100px] text-4xl mt-7 mb-[30px] pb-[20px]'
        />
      </div>
      {post.image_url && (
        <div className='flex justify-center mb-8'>
          <img
            className='h-[500px] w-[100%] rounded object-cover'
            src={post?.image_url}
            alt='img'
          />
        </div>
      )}
      <div>
        <TextareaAutosize
          disabled
          value={post?.body}
          placeholder='Report details'
          className='text-2xl'
        />
      </div>
      <PostLikeBtn
        handlePostLike={handlePostLike}
        isLiked={isLiked}
        likesCount={likesCount}
      />

      <CommentsLayout comments={comments} addComment={addComment} />
    </div>
  );
}

export default PostView;
