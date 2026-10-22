import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../helpers/axiosInstance";
import { toast } from "react-toastify";

const Userlogin = () => {
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");

  let navigate = useNavigate();

  let handleSubmit = e => {
    e.preventDefault();

    axiosInstance
      .get("/user")
      .then(response => {
        if (!Array.isArray(response.data)) {
          toast.error("Could not load user accounts");
          return;
        }

        let info = response.data.find(user => {
          return user.uname === username && user.password === password;
        });

        if (info) {
          toast.success(`${username} logged in successfully`);
          navigate("/");
        } else {
          toast.error("Invalid username or password");
          navigate("/userlogin");
        }
      })
      .catch(() => {
        toast.error(
          "Unable to connect to the server. Check that the backend is running and try again",
        );
      });
  };
  return (
    <div>
      <form action="" onSubmit={handleSubmit}>
        <h2>USER LOGIN</h2>
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
            type="text"
            onChange={e => {
              setPassword(e.target.value);
            }}
          />
        </div>
        <div className="items">
          <button>LOGIN </button>
          <button>CANCEL</button>
        </div>
        <div className="items">
          <Link to="/usersignup">New user ? create an account </Link>
        </div>
      </form>
    </div>
  );
};

export default Userlogin;