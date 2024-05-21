//This component describes the Achievement Pane body
//This component handles logic on the scale of the entire list

import { useState, useEffect } from "react";

import Tab from "react-bootstrap/Tab";
import AchievementItem from "./AchievementItem";
import {
  Achievement,
  UserAchievement,
  GlobalAchievement,
} from "../interfaces/types";

import "../styles/AchievementList.css";

//This interface should be combined with the state variable and rendered that way
interface AchievementListProps {
  items: Achievement[];
  appid: number;
  name: string;
}

function AchievementList(props: AchievementListProps) {
  const [userAchievementData, setUserAchievementData] = useState<
    UserAchievement[]
  >([]);

  const [globalAchievementData, setGlobalAchievementData] = useState<
    GlobalAchievement[]
  >([]);

  //Make a post request when this item is made to get user achievement data
  const postUserAchievementData = async () => {
    try {
      //Send the appid to the server (access token and steamid also needed)
      const response = await fetch(
        "http://localhost:3000/api/achievements/getAchievements",
        {
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
        }
      );

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

  //Make a post request when this item is made to get the global achievement stats
  const postGlobalAchievementData = async () => {
    try {
      //Send the appid to the server (access token and steamid also needed)
      const response = await fetch(
        "http://localhost:3000/api/achievements/getGlobalAchievements",
        {
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
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      //Convert response into Javascript object
      const responseData = await response.json(); // parses JSON response into native JavaScript objects
      //Display the data returned by the server
      setGlobalAchievementData(responseData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  //Gets the game info upon entering the achievement list (called once)
  const handleOnEnter = () => {
    console.log("entered");
    postUserAchievementData();
    postGlobalAchievementData();
  };

  //This combines the globalAchievment percents and props.items with the userAchievement list by name
  useEffect(() => {
    if (userAchievementData.length > 0 && globalAchievementData.length > 0) {
      const temp: UserAchievement[] = userAchievementData.map(
        (userAchievement, index) => {
          const globalAchievement = globalAchievementData.find(
            (ga) => ga.name === userAchievement.apiname
          );

          return {
            ...userAchievement,
            //Combine globalAchievement.percent
            percent: globalAchievement?.percent, // Optional chaining to handle cases where there's no match
            //Bring over glovalAchievement.name just to verify one to one transfer
            otherName: globalAchievement?.name,
            //Combine props.items
            icon: props.items[index]?.icon,
            name: props.items[index]?.name,
            icongray: props.items[index]?.icongray,
            description: props.items[index]?.description,
            displayName: props.items[index]?.displayName,
          };
        }
      );

      setUserAchievementData(temp);
    }
  }, [globalAchievementData, props.items]); // Run whenever globalAchievementData changes

  //This concept shows what a sorted in descending order, delete .sort to go back to default
  const AchievementItems = userAchievementData
    .sort((a, b) => {
      const percentA = a.percent ?? 0; // Default to 0 if undefined
      const percentB = b.percent ?? 0; // Default to 0 if undefined
      return percentB - percentA;
    })
    .map((a) => (
      <AchievementItem
        key={a.name}
        stats={a}
        appid={props.appid}
      ></AchievementItem>
    ));

  return (
    <>
      <Tab.Pane onEnter={handleOnEnter} eventKey={props.appid}>
        {AchievementItems}
      </Tab.Pane>
    </>
  );
}

export default AchievementList;

/*
  //runs on every time globalAchievementData changes, which should only be once
  //both globalAchievementData and userAchievementData share the same percent info
  useEffect(() => {
    if (userAchievementData.length > 0 && globalAchievementData.length > 0) {
      const tempArr: UserAchievement[] = userAchievementData.map(
        (u, index) => ({
          ...u,
          percent: globalAchievementData[index]?.percent,
        })
      );
      setUserAchievementData(tempArr);
    }
  }, [globalAchievementData]); // Run whenever globalAchievementData changes

  */
