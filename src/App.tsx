import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import TCGdex, { SetList, SetResume } from "@tcgdex/sdk";

// Instantiate the SDK
const tcgdex = new TCGdex("en");

type CardBrief = {
  id: string;
  localId: string | number;
  name: string;
  image: string;
};

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100vw",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function App() {
  const [setList, setSetList] = useState<SetList>([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [setSearchTerm, setSetSearchTerm] = useState("");
  const [cardSearchTerm, setCardSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CardBrief[]>([]);
  const [myCards, setMyCards] = useState<CardBrief[]>([]);
  const [showMyCards, setShowMyCards] = useState(false);

  const [searching, setSearching] = useState(false);
  // Fetch all sets
  useEffect(() => {
    const fetchSets = async () => {
      const sets = await tcgdex.fetch("sets");
      setSetList(sets ?? []);
    };

    if (!setList.length) {
      fetchSets();
    }
  }, []);

  const filteredSets = useMemo(() => {
    if (!setSearchTerm) return [];
    return setList.filter((set) => {
      return set.name.toLowerCase().includes(setSearchTerm.toLowerCase());
    });
  }, [setSearchTerm]);

  const reset = () => {
    setSelectedSet("");
    setSetSearchTerm("");
    setCardSearchTerm("");
    setSearchResults([]);
    setSetList([]);
  };

  const pickSet = (set: SetResume) => {
    setSetSearchTerm(set.name);
    setSelectedSet(set.id);
  };

  const searchForCard = async () => {
    setSearching(true);
    const card = await fetch(
      `https://api.tcgdex.net/v2/en/cards?name=${cardSearchTerm}&set=${selectedSet}`
    );
    const list = await card.json();
    setSearchResults(list);
    setSearching(false);
  };

  const checkCard = (card: CardBrief) => {
    // if this card is already in the list, remove it
    // otherwise, add it
    for (let i = 0; i < myCards.length; i++) {
      const myCard = myCards[i];
      if (myCard.id === card.id) {
        const clone = myCards.slice();
        // remove the card
        clone.splice(i, 1);
        setMyCards(clone);
        return;
      }
    }
    setMyCards(myCards.concat(card));
  };

  const cardIsChecked = (cardId: string) => {
    return myCards.some((c) => {
      return c.id === cardId;
    });
  };

  const handleKeyDown = (key: string) => {
    console.log(key);
    if (key === "Enter" && cardSearchTerm) {
      searchForCard();
    }
  };

  console.log(setList);
  return (
    <Box>
      <TextField
        value={setSearchTerm}
        onChange={(val) => setSetSearchTerm(val.target.value)}
        style={{ border: "1px solid white", color: "white" }}
        label={"Set"}
        color={"primary"}
        disabled={!!selectedSet}
      />

      {selectedSet && (
        <TextField
          onKeyDown={(e) => handleKeyDown(e.key)}
          value={cardSearchTerm}
          onChange={(val) => setCardSearchTerm(val.target.value)}
          style={{ border: "1px solid white", color: "white" }}
          label={"Card Name"}
          color={"primary"}
        />
      )}

      <Button onClick={() => searchForCard()}>Search</Button>
      <Button onClick={reset}>Reset</Button>
      {myCards.length > 0 && (
        <Button onClick={() => setShowMyCards(true)}>
          See my selected cards
        </Button>
      )}
      {!selectedSet && (
        <Box>
          {filteredSets.length > 0 ? (
            <List>
              {filteredSets.map((set) => {
                return (
                  <ListItem>
                    <Button onClick={() => pickSet(set)}>{set.name}</Button>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography>No sets found</Typography>
          )}
        </Box>
      )}
      {searching ? (
        <CircularProgress />
      ) : (
        <Box>
          {searchResults.length > 0 && (
            <ImageList cols={6}>
              {searchResults.map((c) => {
                return (
                  <ImageListItem style={{ width: "200px" }}>
                    <Checkbox
                      label="Select"
                      onClick={() => checkCard(c)}
                      checked={cardIsChecked(c.id)}
                    />
                    <img
                      src={`${c.image}/high.png`}
                      onClick={() => checkCard(c)}
                    />
                  </ImageListItem>
                );
              })}
            </ImageList>
          )}
        </Box>
      )}
      <Modal open={showMyCards} onClose={() => setShowMyCards(false)}>
        <Box sx={modalStyle}>
          <ImageList cols={6}>
            {myCards.map((c) => {
              return (
                <ImageListItem style={{ width: "200px" }}>
                  <img src={`${c.image}/high.png`} />
                  <Button onClick={() => checkCard(c)}>Remove</Button>
                </ImageListItem>
              );
            })}
          </ImageList>
        </Box>
      </Modal>
    </Box>
  );
}

export default App;
