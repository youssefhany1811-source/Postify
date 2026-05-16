import React, { useState } from "react";
import { TextareaAutosize } from "@mui/material";
import { useNavigate } from "react-router";
import api from "../api/axios";
import AlertPopup from "../components/popup/AlertPopup";
import { usePosts } from "../context/PostsContext";

function PostCreate() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [responseState, setResponseState] = useState(null);
  const { prependPostToSection } = usePosts();
  const nav = useNavigate();

  async function handlePostPublish() {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", body);
      if (image) formData.append("image", image);

      const response = await api.post("posts", formData);
      const createdPost = response?.data?.post;

      if (createdPost?.id) {
        prependPostToSection(createdPost, "history");
      }

      setResponseState({
        error: false,
        message: response?.data?.message || "Post published successfully!",
      });
      setIsOpen(true);
      nav("/posts/history");
    } catch (error) {
      setResponseState({
        error: true,
        message: error.message || "Failed to create post. Please try again.",
      });
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleImageChange(e) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setImage(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  return (
    <div className='container-c'>
      <AlertPopup
        is_open={isOpen}
        setIs_open={setIsOpen}
        status={responseState}
      />

      <div className='cool-panel'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h1 className='page-title mb-0'>Craft Your Post</h1>
          <button
            onClick={handlePostPublish}
            disabled={isLoading}
            className={`action-btn ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Publishing..." : "Publish"}
          </button>
        </div>

        <label
          className={`upload-zone mb-5 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span>Drop a cover image or click to upload</span>
          <input
            type='file'
            className='hidden'
            disabled={isLoading}
            onChange={handleImageChange}
          />
        </label>

        <TextareaAutosize
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='A title that pulls readers in'
          disabled={isLoading}
          className='cool-title-input'
        />

        {preview && (
          <div className='mb-8'>
            <img className='post-cover-preview' src={preview} alt='post preview' />
          </div>
        )}

        <TextareaAutosize
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='Tell your story...'
          disabled={isLoading}
          className='cool-body-input'
        />
      </div>
    </div>
  );
}

export default PostCreate;
