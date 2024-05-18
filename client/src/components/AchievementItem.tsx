//import { useEffect, useState } from "react";
import { useEffect, useState } from "react";

import Button from "react-bootstrap/Button";
import "../styles/AchievementItem.css";

interface Achievement {
  icon: string;
  name: string;
  icongray: string;
  description: string;
  displayName: string;
}

interface AchivementItemProps {
  item: Achievement;
  appid: number;
}

function AchievementItem(props: AchivementItemProps) {
  //Make POST request to server to retrieve user achievement data
  const postData = async () => {
    try {
      //Send the appid to the server (access token and steamid also needed)
      const response = await fetch("http://localhost:3000/getStuff", {
        method: "POST",
        headers: {
          // Tells the server that the client expects JSON in response
          Accept: "application/json",
          // Indicates that the request body is JSON
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appid: props.appid,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      //Convert response into Javascript object
      const responseData = await response.json(); // parses JSON response into native JavaScript objects
      //Display the data returned by the server
      console.log(responseData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <>
      <Button onClick={postData}>P</Button>
      <div className="ach-card">
        <img className="ach-image" src={props.item.icongray} />
        <div className="ach-body">
          <h3>{props.item.displayName}</h3>
          <p>
            {props.item.description} {props.item.name}
          </p>
        </div>
      </div>
    </>
  );
}

export default AchievementItem;
