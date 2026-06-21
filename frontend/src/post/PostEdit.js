import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { TextareaAutosize } from "@mui/material";
import AlertPopup from "../components/popup/AlertPopup";
import AlertDialog from "../components/popup/AlertDialog";
import Skeleton from "@mui/material/Skeleton";
import { usePosts } from "../context/PostsContext";
import api from "../api/axios";
import PostLikeBtn from "../components/PostLikeBtn";
import CommentsLayout from "../components/comment/CommentsLayout";
import ReportLocationPicker from "../components/ReportLocationPicker";
import ReportWritingAssistant from "../components/ReportWritingAssistant";

function PostEdit() {
  const categories = [
    "waste",
    "roads",
    "street_lights",
    "water",
    "safety",
    "noise",
    "other",
  ];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("other");
  const [locationValue, setLocationValue] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [status, setStatus] = useState("new");
  const [isLoading, setIsLoading] = useState(true);
  const [is_open, setIs_open] = useState(false);
  const [res, setRes] = useState(null);
  const [open, setOpen] = React.useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [comments, setComments] = useState([]);
  const { updatePost, deletePost, allPosts } = usePosts();

  const navigate = useNavigate();

  function open_confirm() {
    setOpen(true);
  }

  function close_confirm() {
    setOpen(false);
  }

  const postId = useParams().id;

  function getApiErrorMessage(error) {
    const data = error?.response?.data;
    const firstError = data?.errors && Object.values(data.errors)[0];

    if (Array.isArray(firstError) && firstError[0]) {
      return firstError[0];
    }

    return data?.message || error.message || "Failed to update report. Please try again.";
  }

  async function handlePostLike() {
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

  useEffect(() => {
    async function getPost() {
      let res = await api.get(`reports/${postId}`);
      console.log("Post data:", res.data);

      setTitle(res.data.post.title);
      setBody(res.data.post.body);
      setImage(res.data.post.image_url);
      setCategory(res.data.post.category || "other");
      setLocationValue(res.data.post.location || "");
      setContactPhone(res.data.post.contact_phone || "");
      setLatitude(res.data.post.latitude || "");
      setLongitude(res.data.post.longitude || "");
      setStatus(res.data.post.status || "new");
      setComments(res.data.comments);

      setLikesCount(res.data.post.supports_count ?? res.data.post.likes_count);
      setIsLoading(false);

      if (res.data.post.liked) {
        setIsLiked(true);
      } else {
        setIsLiked(false);
      }
    }
    getPost();
  }, [postId]);

  async function handlePostPublish() {
    try {
      let formData = new FormData();
      formData.append("title", title);
      formData.append("body", body);
      formData.append("category", category);
      formData.append("location", locationValue);
      formData.append("contact_phone", contactPhone);
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);
      formData.append("_method", "PATCH");

      if (image instanceof File) {
        formData.append("image", image);
      }

      let response = await api.post(`reports/${postId}`, formData);
      const updatedPost = response.data.post;

      updatePost(updatedPost);

      setRes({ error: false, message: response.data.message });
    } catch (error) {
      setRes({ error: true, message: getApiErrorMessage(error) });
    }

    setIs_open(true);
  }

  async function handlePostDelete() {
    //TODO: the post don't removed from the posts state after it deleted
    close_confirm();
    let response = await api.delete(`reports/${postId}`);

    if (response.error) {
      setRes({ error: true, message: response.message });
    } else {
      setRes({ error: false, message: response.data.message });
      console.log(allPosts, "}{}{{}");

      deletePost(postId);
      setTimeout(() => {
        navigate("/reports/history", { replace: true });
        console.log(allPosts, "_______________");
      }, 1200);
    }
    setIs_open(true);
  }

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

  if (isLoading) {
    return (
      <div className='container-c'>
        <div className='flex items-center mb-5 flex-row-reverse gap-x-2'>
          <Skeleton
            variant='rectangular'
            width={80}
            height={40}
            className='rounded'
          />
          <Skeleton
            variant='rectangular'
            className='rounded'
            width={80}
            height={40}
          />
        </div>
        <Skeleton variant='rectangular' height={50} className='mb-[50px]' />
        <Skeleton variant='rectangular' height={300} />
      </div>
    );
  }

  return (
    <div>
      <AlertDialog
        open={open}
        onClose={close_confirm}
        title={"Confirm Deletion"}
        content={
          "Are you sure you want to delete this report? Once deleted, it cannot be recovered."
        }
        onConfirm={handlePostDelete}
      />
      <AlertPopup
        message={"Report updated successfully"}
        is_open={is_open}
        setIs_open={setIs_open}
        status={res}
      />
      <div className='container-c'>
        <div className='mb-5 flex flex-wrap gap-2 text-sm text-slate-200'>
          <span className='report-meta-chip bg-emerald-800/60'>
            status: {status.replaceAll("_", " ")}
          </span>
        </div>
        <label className='upload-zone mb-5 max-w-[240px]'>
          <span className='text-white'>Upload Photo</span>
          <input
            type='file'
            className='hidden'
            onChange={(e) => {
              setImage(e.target.files[0]);
              setPreview(URL.createObjectURL(e.target.files[0]));
            }}
          />
        </label>
        <div className='flex items-center mb-5 flex-row-reverse gap-x-2'>
          <button
            onClick={open_confirm}
            className='bg-red-500 text-white font-semibold min-w-[100px]'
          >
            Delete
          </button>
          <button
            onClick={handlePostPublish}
            className='action-btn text-sm min-w-[100px]'
          >
            Update
          </button>
        </div>
        <div>
          <TextareaAutosize
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Issue title'
            className={`w-full h-[100px] text-5xl mb-[30px] pb-[20px] `}
          />
        </div>
        <div className='mb-5 grid gap-4 md:grid-cols-2'>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='report-field report-select'
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <input
            value={locationValue}
            onChange={(e) => setLocationValue(e.target.value)}
            placeholder='Location or neighborhood'
            className='report-field'
          />
        </div>
        <div className='mb-5'>
          <label className='mb-2 text-sm font-semibold text-slate-200'>
            Phone number
          </label>
          <input
            type='tel'
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder='Example: +20 10 0000 0000'
            className='report-field'
          />
          <p className='mt-2 text-xs leading-5 text-slate-400'>
            We ask for this number so the responsible team can contact you if they need exact access details or clarification before fixing the issue.
          </p>
        </div>
        <ReportLocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(nextLat, nextLng) => {
            setLatitude(String(nextLat));
            setLongitude(String(nextLng));
          }}
        />
        {image && (
          <div className='flex justify-center mb-8'>
            <img
              className='h-[500px] w-[100%] rounded object-cover'
              src={preview ? preview : image}
              alt='img'
            />
          </div>
        )}
        <div>
          <TextareaAutosize
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='Describe the issue'
            className='cool-body-input'
          />
        </div>
        <ReportWritingAssistant
          title={title}
          body={body}
          onApply={(report) => {
            setTitle(report.title);
            setBody(report.body);
          }}
        />
        <PostLikeBtn
          handlePostLike={handlePostLike}
          isLiked={isLiked}
          likesCount={likesCount}
        />

        <CommentsLayout comments={comments} addComment={addComment} />
      </div>
    </div>
  );
}

export default PostEdit;
