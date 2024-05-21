import { useEffect, useState } from "react";

import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import ListGroup from "react-bootstrap/ListGroup";

import AchievementList from "./AchievementList.tsx";
import GameItem from "./GameItem.tsx";

import { Game } from "../interfaces/types.tsx";

import "../styles/List.css";

function List() {
  //const [count, setCount] = useState(0);

  const [userLibraryState, setUserLibraryState] = useState<Game[]>([]);

  //Fetch the game data from the backend (API or Database determined by server)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/games/getGames"
        );
        const data = await response.json();
        setUserLibraryState(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const gameItems = userLibraryState.map((item) => (
    <GameItem key={item.appid} game={item} />
  ));

  //For each game for each achievement
  const achievementBodies = userLibraryState.map((game) => (
    <AchievementList
      key={game.appid}
      name={game.name}
      appid={game.appid}
      items={game.achievements}
    />
  ));

  return (
    <>
      <Nav variant="tabs" defaultActiveKey="/home">
        <Nav.Item>
          <Nav.Link href="">Steam</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="link-1">PlayStation</Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Container>
        <ListGroup horizontal className="test-list-group">
          <Col xs={1} sm={2} md={1} lg={2} xl={3} xxl={2} className="nav-games">
            <h3 className="games-column">Games</h3>
            <Nav variant="pills">{gameItems}</Nav>
          </Col>

          <ListGroup.Item className="nav-achievements">
            <h3 className="achievements-column">Achievements</h3>
            <Tab.Content>{achievementBodies}</Tab.Content>
          </ListGroup.Item>
        </ListGroup>
      </Tab.Container>
    </>
  );
}

export default List;
