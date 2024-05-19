import { useEffect, useState } from "react";
import TabItem from "./TabItem.tsx";

import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";

import PaneItem from "./PaneItem";

import "../styles/List.css";

interface Achievement {
  icon: string;
  name: string;
  icongray: string;
  description: string;
  displayName: string;
}

interface Game {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  has_community_visible_stats: boolean;
  achievements: Achievement[];
}

function List() {
  //const [count, setCount] = useState(0);

  const [userLibraryState, setUserLibraryState] = useState<Game[]>([]);

  //Fetch the game data from the backend (API or Database determined by server)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/");
        const data = await response.json();
        setUserLibraryState(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const tabItems = userLibraryState.map((item) => (
    <TabItem key={item.appid} game={item} />
  ));

  //For each game for each achievement
  const tabPaneItems = userLibraryState.map((game) => (
    <PaneItem
      key={game.appid}
      name={game.name}
      appid={game.appid}
      items={game.achievements}
    />
  ));

  return (
    <>
      <Tab.Container>
        <Row>
          <Col sm={3}>
            <Nav variant="pills">{tabItems}</Nav>
          </Col>
          <Col sm={8}>
            <Tab.Content>{tabPaneItems}</Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </>
  );
}

export default List;
