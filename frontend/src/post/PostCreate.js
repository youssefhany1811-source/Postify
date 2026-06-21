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
  const [contactPhone, setContactPhone] = useState("");
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
      formData.append("contact_phone", contactPhone);
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
    <div className='mx-auto max-w-4xl px-4 pb-10'>
      <AlertPopup
        is_open={isOpen}
        setIs_open={setIsOpen}
        status={responseState}
      />

      <div className='cool-panel'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='page-title mb-2'>Report a Community Issue</h1>
            <p className='text-sm text-slate-400'>
              Add the issue details, location, and contact number for follow-up.
            </p>
          </div>
          <button
            onClick={handlePostPublish}
            disabled={isLoading}
            className={`action-btn ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Submitting..." : "Submit Report"}
          </button>
        </div>

        <div className='space-y-6'>
          <section className='rounded-2xl border border-slate-700 bg-slate-950/30 p-4'>
            <div className='mb-4'>
              <h2 className='text-xl font-semibold text-white'>Issue details</h2>
            </div>

            <label className='mb-2 text-sm font-semibold text-slate-200'>
              Title
            </label>
            <TextareaAutosize
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Example: Broken street light near Giza Square'
              disabled={isLoading}
              className='cool-title-input text-3xl md:text-4xl'
            />

            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <label className='mb-2 text-sm font-semibold text-slate-200'>
                  Category
                </label>
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
              </div>

              <div>
                <label className='mb-2 text-sm font-semibold text-slate-200'>
                  Location or neighborhood
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder='Example: Faisal Street, Giza'
                  disabled={isLoading}
                  className='report-field'
                />
              </div>
            </div>
          </section>

          <section className='rounded-2xl border border-slate-700 bg-slate-950/30 p-4'>
            <div className='mb-4'>
              <h2 className='text-xl font-semibold text-white'>Contact and map</h2>
            </div>

            <label className='mb-2 text-sm font-semibold text-slate-200'>
              Phone number
            </label>
            <input
              type='tel'
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder='Example: +20 10 0000 0000'
              disabled={isLoading}
              className='report-field'
            />
            <p className='mt-2 mb-5 text-xs leading-5 text-slate-400'>
              We ask for this number so the responsible team can contact you if they need exact access details or clarification before fixing the issue.
            </p>

            <ReportLocationPicker
              latitude={latitude}
              longitude={longitude}
              disabled={isLoading}
              onChange={(nextLat, nextLng) => {
                setLatitude(String(nextLat));
                setLongitude(String(nextLng));
              }}
            />
          </section>

          <section className='rounded-2xl border border-slate-700 bg-slate-950/30 p-4'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
              <h2 className='text-xl font-semibold text-white'>Description and photo</h2>
              <label
                className={`upload-zone min-w-[220px] px-4 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span>Upload photo</span>
                <input
                  type='file'
                  className='hidden'
                  disabled={isLoading}
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {preview && (
              <div className='mb-5'>
                <img className='post-cover-preview' src={preview} alt='post preview' />
              </div>
            )}

            <label className='mb-2 text-sm font-semibold text-slate-200'>
              Description
            </label>
            <TextareaAutosize
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='Describe what happened, how long it has been there, and any safety risks.'
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
          </section>

          <button
            onClick={handlePostPublish}
            disabled={isLoading}
            className={`action-btn w-full ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostCreate;
