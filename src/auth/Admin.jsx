import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../helpers/axiosInstance";

const Admin = () => {
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");
  let [isSubmitting, setIsSubmitting] = useState(false);
  let navigate = useNavigate();

  let handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.get("/admin");
      const admin = Array.isArray(response.data) ? response.data[0] : null;

      if (!admin) {
        toast.error("Admin credentials are unavailable. Please try again later");
      } else if (username === admin.username && password === admin.password) {
        toast.success("Admin logged in successfully");
        localStorage.setItem("token", true);
        navigate("/admindashboard");
      } else {
        toast.error("Please check admin credentials");
      }
    } catch {
      toast.error("Could not load admin credentials. Check that the backend is running");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <form action="" onSubmit={handleSubmit}>
        <h2>ADMIN LOGIN</h2>
        <div className="items">
          <label htmlFor="username"> USERNAME</label>
          <input
            id="username"
            type="text"
            onChange={e => {
              setUsername(e.target.value);
            }}
          />
        </div>
        <div className="items">
          <label htmlFor="password">PASSWORD</label>
          <input
            id="password"
            type="password"
            onChange={e => {
              setPassword(e.target.value);
            }}
          />
        </div>
        <div className="items">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "LOADING..." : "LOGIN"}
          </button>
          <button type="button">CANCEL</button>
        </div>
      </form>
    </div>
  );
};

export default Admin;