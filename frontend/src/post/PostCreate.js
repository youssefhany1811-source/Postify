import React, { useState } from "react";
import { TextareaAutosize } from "@mui/material";
import { useNavigate } from "react-router";
import api from "../api/axios";
import AlertPopup from "../components/popup/AlertPopup";
import { usePosts } from "../context/PostsContext";
import ReportLocationPicker from "../components/ReportLocationPicker";
import ReportWritingAssistant from "../components/ReportWritingAssistant";

function PostCreate() {
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
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [responseState, setResponseState] = useState(null);
  const { prependPostToSection } = usePosts();
  const nav = useNavigate();

  function getApiErrorMessage(error) {
    const data = error?.response?.data;
    const firstError = data?.errors && Object.values(data.errors)[0];

    if (Array.isArray(firstError) && firstError[0]) {
      return firstError[0];
    }

    return data?.message || error.message || "Failed to submit report. Please try again.";
  }

  async function handlePostPublish() {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("body", body);
      formData.append("category", category);
      formData.append("location", location);
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);
      if (image) formData.append("image", image);

      const response = await api.post("reports", formData);
      const createdPost = response?.data?.post;

      if (createdPost?.id) {
        prependPostToSection(createdPost, "history");
      }

      setResponseState({
        error: false,
        message: response?.data?.message || "Report submitted successfully!",
      });
      setIsOpen(true);
      nav("/reports/history");
    } catch (error) {
      setResponseState({
        error: true,
        message: getApiErrorMessage(error),
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
          <h1 className='page-title mb-0'>Report a Community Issue</h1>
          <button
            onClick={handlePostPublish}
            disabled={isLoading}
            className={`action-btn ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Submitting..." : "Submit Report"}
          </button>
        </div>

        <label
          className={`upload-zone mb-5 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span>Upload a photo of the issue</span>
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

        <div className='mb-5 grid gap-4 md:grid-cols-2'>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
            className='report-field report-select'
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder='Location or neighborhood'
            disabled={isLoading}
            className='report-field'
          />
        </div>

        <ReportLocationPicker
          latitude={latitude}
          longitude={longitude}
          disabled={isLoading}
          onChange={(nextLat, nextLng) => {
            setLatitude(String(nextLat));
            setLongitude(String(nextLng));
          }}
        />

        {preview && (
          <div className='mb-8'>
            <img className='post-cover-preview' src={preview} alt='post preview' />
          </div>
        )}

        <TextareaAutosize
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='Describe the problem clearly...'
          disabled={isLoading}
          className='cool-body-input'
        />

        <ReportWritingAssistant
          title={title}
          body={body}
          disabled={isLoading}
          onApply={(report) => {
            setTitle(report.title);
            setBody(report.body);
          }}
        />
      </div>
    </div>
  );
}

export default PostCreate;
