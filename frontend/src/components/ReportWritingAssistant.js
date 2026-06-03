import React, { useEffect, useState } from "react";
import api from "../api/axios";

const tones = [
  { value: "clear", label: "Clear" },
  { value: "polite", label: "Polite" },
  { value: "urgent", label: "Urgent" },
  { value: "official", label: "Official" },
];

function getApiErrorMessage(error) {
  const data = error?.response?.data;
  const firstError = data?.errors && Object.values(data.errors)[0];

  if (Array.isArray(firstError) && firstError[0]) {
    return firstError[0];
  }

  return data?.message || error.message || "AI writing is temporarily unavailable.";
}

function ReportWritingAssistant({ title, body, disabled, onApply }) {
  const [tone, setTone] = useState("clear");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("idle");

  useEffect(() => {
    if (messageType === "success") {
      setMessage("Text changed. Review it before submitting.");
    }
  }, [title, body, messageType]);

  async function handleEnhance() {
    if (isEnhancing || disabled) return;

    if (title.trim().length < 5 || body.trim().length < 20) {
      setMessage("Add a title and at least 20 characters before enhancing.");
      setMessageType("error");
      return;
    }

    setIsEnhancing(true);
    setMessage("");
    setMessageType("idle");

    try {
      const response = await api.post("reports/enhance", {
        title,
        body,
        tone,
      });

      onApply(response.data.report);
      setMessage("Text changed. Review it before submitting.");
      setMessageType("success");
    } catch (error) {
      setMessage(getApiErrorMessage(error));
      setMessageType("error");
    } finally {
      setIsEnhancing(false);
    }
  }

  return (
    <div className={`writing-assistant ${isEnhancing ? "is-loading" : ""}`}>
      <div className='writing-assistant-header'>
        <div>
          <div className='writing-assistant-title'>AI writing helper</div>
          <div className='writing-assistant-subtitle'>Improve wording and choose the tone.</div>
        </div>
        <button
          type='button'
          onClick={handleEnhance}
          disabled={disabled || isEnhancing}
          className='writing-assistant-btn'
        >
          {isEnhancing ? "Enhancing..." : "Enhance"}
        </button>
      </div>

      <div className='writing-tone-row'>
        {tones.map((item) => (
          <button
            key={item.value}
            type='button'
            disabled={disabled || isEnhancing}
            onClick={() => setTone(item.value)}
            className={`writing-tone-btn ${tone === item.value ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isEnhancing && (
        <div className='writing-loading'>
          <div className='writing-loading-orbit'>
            <span />
            <span />
            <span />
          </div>
          <div className='writing-loading-copy'>
            <strong>Rewriting your report</strong>
            <span>Cleaning wording, keeping the facts, applying tone.</span>
          </div>
        </div>
      )}

      {message && (
        <div className={`writing-assistant-message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default ReportWritingAssistant;
