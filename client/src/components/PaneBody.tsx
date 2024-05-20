//This component describes the Achievement Pane body
//This component handles logic on the scale of the entire list

import { useState } from "react";

import Tab from "react-bootstrap/Tab";
import PaneItem from "./PaneItem";
import { Achievement, UserAchievement } from "../interfaces/types";

import "../styles/PaneItem.css";

interface PaneBodyProps {
  items: Achievement[];
  appid: number;
  name: string;
}

function PaneBody(props: PaneBodyProps) {
  const [userAchievementData, setUserAchievementData] = useState<
    UserAchievement[]
  >([]);

  //Make a post request when this item is made to get user achievement data
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
      setUserAchievementData(responseData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const defaultAchievement: UserAchievement = {
    apiname: "null",
    achieved: 0,
    unlocktime: 0,
  };

  console.log(userAchievementData);
  //Returns an individual Achievment item
  const AchievementItems = props.items.map((a, index) => (
    <PaneItem
      key={a.name}
      item={a}
      unlock_info={
        userAchievementData.length > 0
          ? userAchievementData[index]
          : defaultAchievement
      }
      appid={props.appid}
    ></PaneItem>
  ));

  //Run a function here that gets achievement info and passes it into pane body

  return (
    <>
      <Tab.Pane onEnter={postData} eventKey={props.appid}>
        {AchievementItems}
      </Tab.Pane>
    </>
  );
}

export default PaneBody;
