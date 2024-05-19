import { useState } from "react";

import Tab from "react-bootstrap/Tab";
import PaneBody from "../components/PaneBody";

interface Achievement {
  icon: string;
  name: string;
  icongray: string;
  description: string;
  displayName: string;
}

interface UserAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

interface PaneItemProps {
  items: Achievement[];
  appid: number;
  name: string;
}

function PaneItem(props: PaneItemProps) {
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
    <PaneBody
      key={a.name}
      item={a}
      unlock_info={
        userAchievementData.length > 0
          ? userAchievementData[index]
          : [defaultAchievement]
      }
      appid={props.appid}
    ></PaneBody>
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

export default PaneItem;
