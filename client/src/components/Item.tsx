import "../styles/Item.css";

import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

interface ItemProps {
  title: string;
  appid: string;
}

const imageURL: string = "https://cdn.akamai.steamstatic.com/steam/apps/";
const imageURLEnd: string = "/header.jpg";

//Get the id numbers for each image (better suited for item)
function getImageURL(id: string) {
  return imageURL + id + imageURLEnd;
}

//Display the game and its image
function Item(props: ItemProps) {
  return (
    <>
      <Card style={{ width: "18rem" }}>
        <Card.Img variant="top" src={getImageURL(props.appid)} />
        <Card.Body>
          <Card.Title>{props.title}</Card.Title>
          <Card.Text>
            Some quick example text to build on the card title and make up the
            bulk of the card's content.
          </Card.Text>
          <Button variant="primary">Go somewhere</Button>
        </Card.Body>
      </Card>
    </>
  );
}

export default Item;
