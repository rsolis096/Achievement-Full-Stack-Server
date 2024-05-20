import { useEffect, useState } from "react";
import TabItem from "./TabItem.tsx";

import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Tab from "react-bootstrap/Tab";

import PaneItem from "./PaneBody.tsx";

import { Game } from "../interfaces/types.tsx";

import "../styles/List.css";

function List() {
  //const [count, setCount] = useState(0);

  const [userLibraryState, setUserLibraryState] = useState<Game[]>([]);

  //Fetch the game data from the backend (API or Database determined by server)
  //Needs to be done upon render of list, so useEffect is used
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
      <Nav variant="tabs" defaultActiveKey="/home">
        <Nav.Item>
          <Nav.Link href="">Steam</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="link-1">PlayStation</Nav.Link>
        </Nav.Item>
      </Nav>

      <Tab.Container>
        <Row>
          <Col xs={1} sm={2} md={1} lg={2} xl={3} xxl={2} className="nav-games">
            <h3 className="games-column">Games</h3>
            <Nav variant="pills">{tabItems}</Nav>
          </Col>
          <Col
            xs={3}
            sm={3}
            md={3}
            lg={3}
            xl={5}
            xxl={3}
            className="nav-achievements"
          >
            <h3 className="achievements-column">Achievements</h3>

            <Row className="achievements-header">
              <Col xl={2}>Image</Col>
              <Col xl={7}>Name and Description</Col>
              <Col xl={1}>Unlocked</Col>
            </Row>

            <Tab.Content>{tabPaneItems}</Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </>
  );
}

export default List;
