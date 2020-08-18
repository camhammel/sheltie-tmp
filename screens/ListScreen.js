import React, { useState, useContext, useEffect } from "react";
import {
  View,
  AsyncStorage,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Text, Button } from "react-native-elements";
import ListComponent from "../components/ListComponent";
import SearchHeader from "../components/SearchHeader";
import petfinder from "../api/petfinder";
import { Context as TokenContext } from "../context/TokenContext";
import * as Location from "expo-location";
import { COLORS } from "../assets/colors";
import Modal from "react-native-modal";
import MySlider from "../components/MySlider";
import DropDownPicker from "react-native-dropdown-picker";
import Spacer from "../components/Spacer";

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const ListScreen = ({ navigation }) => {
  const { update_token } = useContext(TokenContext);
  const [distance, setDistance] = useState(100);
  const [age, setAge] = useState([]);
  const [type, setType] = useState("dog");
  const [breed, setBreed] = useState([]);
  const [breedOptions, setBreedOptions] = useState([]);
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isTypeVisible, setTypeVisible] = useState(false);
  const [isBreedVisible, setBreedVisible] = useState(false);
  const [isAgeVisible, setAgeVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  useEffect(() => {
    (async () => {
      getBreedOptions();
    })();
  }, [type]);

  useEffect(() => {
    (async () => {
      await searchApi();
    })();
  }, [location]);

  useEffect(() => {
    (async () => {
      let temp = JSON.parse(await AsyncStorage.getItem("lastpets"));
      setResults(temp);
      let temp2 = JSON.parse(await AsyncStorage.getItem("lastsearch"));
      if ((await temp2) != null) {
        setAge(await temp2.age);
        setDistance(await temp2.distance);
        setType(await temp2.type);
        setBreed(await temp2.breed);
      }

      let { status } = await Location.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied. Try again.");
        const { newstatus, permissions } = await Permissions.askAsync(
          Permissions.LOCATION
        );
        if (!newstatus === "granted") {
          throw new Error("Location permissions not granted.");
        }
      }

      let location = await Location.getCurrentPositionAsync({});
      console.log(
        "location: " +
          location.coords.latitude +
          "," +
          location.coords.longitude
      );
      setLocation(location);
      await getBreedOptions();
      searchApi();
    })();
  }, []);

  const loadMoreResults = async () => {
    if (loadingMore) {
      return;
    }
    setLoadingMore(true);
    setCurrentPage(currentPage + 1);
    console.log("rendering page " + currentPage + "...");
    await retrieveNewPage();
    setLoadingMore(false);
  };

  const retrieveNewPage = async () => {
    var searchReq = `animals?type=${type}&limit=50&location=${location.coords.latitude},${location.coords.longitude}&sort=distance&age=${age}&distance=${distance}&breed=${breed}&page=${currentPage}`;

    petfinder
      .get(searchReq, {
        headers: {
          Authorization: `Bearer ${(
            await AsyncStorage.getItem("token")
          ).toString()}`,
        },
      })
      .then((response) => {
        let temp3 = results;
        for (let item of response.data.animals) {
          if (!temp3.includes(item)) {
            temp3.push(item);
          }
        }
        setResults(temp3);
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          //console.log(error.response.status);
          //console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
        //console.log(error.config);
      });
  };

  const getBreedOptions = async () => {
    var breedSearch = `types/${type}/breeds`;

    petfinder
      .get(breedSearch, {
        headers: {
          Authorization: `Bearer ${(
            await AsyncStorage.getItem("token")
          ).toString()}`,
        },
      })
      .then((response) => {
        const my_breeds = response.data.breeds.map((breed1) => {
          return {
            label: breed1.name,
            value: breed1.name,
          };
        });
        console.log("breeds: " + JSON.stringify(my_breeds));
        setBreedOptions(my_breeds);
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          //console.log(error.response.status);
          //console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
        //console.log(error.config);
      });
  };

  const searchApi = async () => {
    setCurrentPage(1);
    await update_token();
    console.log(
      "Token value in storage is: " +
        (await AsyncStorage.getItem("token")).toString()
    );

    var searchReq = `animals?type=${type}&limit=50&location=${location.coords.latitude},${location.coords.longitude}&sort=distance&age=${age}&distance=${distance}&breed=${breed}`;

    const this_search = {
      type,
      age,
      distance,
      breed,
    };

    petfinder
      .get(searchReq, {
        headers: {
          Authorization: `Bearer ${(
            await AsyncStorage.getItem("token")
          ).toString()}`,
        },
      })
      .then((response) => {
        setResults(response.data.animals);
        AsyncStorage.setItem("lastpets", JSON.stringify(response.data.animals));
        AsyncStorage.setItem("lastsearch", JSON.stringify(this_search));
        //console.log(response.data.animals);
      })
      .catch(function (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          //console.log(error.response.status);
          //console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error", error.message);
        }
        //console.log(error.config);
      });
  };

  return (
    <View style={{ justifyContent: "flex-start", flex: 1, borderWidth: 0 }}>
      <Modal
        isVisible={isModalVisible}
        hasBackdrop={true}
        backdropOpacity={0.5}
      >
        <View
          style={{
            borderRadius: 15,
            height: 600,
            backgroundColor: "white",
          }}
        >
          <Text
            h3
            style={{
              textAlign: "center",
              marginTop: 15,
              marginBottom: 25,
              color: "grey",
              fontWeight: "bold",
            }}
          >
            Search Filters
          </Text>
          <View style={{ flex: 1 }}>
            <MySlider distance={distance} setDistance={setDistance} />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 20,
                color: COLORS.primary,
                marginLeft: 15,
                marginBottom: 5,
                marginTop: 20,
              }}
            >
              AGE
            </Text>
            <DropDownPicker
              items={[
                {
                  label: "Baby",
                  value: "Baby",
                },
                {
                  label: "Young",
                  value: "Young",
                },
                {
                  label: "Adult",
                  value: "Adult",
                },
                {
                  label: "Senior",
                  value: "Senior",
                },
              ]}
              defaultValue={age}
              placeholder="Any age"
              multiple={true}
              multipleText={age.join(", ")}
              min={0}
              max={4}
              containerStyle={{ height: 40, marginHorizontal: 10 }}
              style={{ backgroundColor: "#fafafa" }}
              itemStyle={{
                justifyContent: "flex-start",
              }}
              dropDownStyle={{ backgroundColor: "#fafafa", marginBottom: 40 }}
              onChangeItem={(item) => setAge(item)}
              isVisible={isAgeVisible}
              onOpen={() => {
                setAgeVisible(true);
                setTypeVisible(false);
                setBreedVisible(false);
              }}
              onClose={() => setAgeVisible(false)}
              zIndex={5000}
            />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 20,
                color: COLORS.primary,
                marginLeft: 15,
                marginBottom: 5,
                marginTop: 20,
              }}
            >
              ANIMAL TYPE
            </Text>
            <DropDownPicker
              items={[
                {
                  label: "Dog",
                  value: "dog",
                },
                {
                  label: "Cat",
                  value: "cat",
                },
                {
                  label: "Bird",
                  value: "bird",
                },
                {
                  label: "Rabbit",
                  value: "rabbit",
                },
              ]}
              defaultValue={type}
              containerStyle={{ height: 40, marginHorizontal: 10 }}
              style={{ backgroundColor: "#fafafa" }}
              itemStyle={{
                justifyContent: "flex-start",
              }}
              dropDownStyle={{ backgroundColor: "#fafafa" }}
              onChangeItem={(item) => {
                setType(item.value);
                setBreed([]);
              }}
              isVisible={isTypeVisible}
              onOpen={() => {
                setTypeVisible(true);
                setBreedVisible(false);
                setAgeVisible(false);
              }}
              onClose={() => setTypeVisible(false)}
              zIndex={4000}
            />
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 20,
                color: COLORS.primary,
                marginLeft: 15,
                marginBottom: 5,
                marginTop: 20,
              }}
            >
              ANIMAL BREEDS
            </Text>
            <DropDownPicker
              items={breedOptions}
              defaultValue={breed}
              placeholder="Any breed"
              multiple={true}
              multipleText={breed.join(", ")}
              min={0}
              max={100}
              containerStyle={{ height: 40, marginHorizontal: 10 }}
              style={{ backgroundColor: "#fafafa" }}
              itemStyle={{
                justifyContent: "flex-start",
              }}
              dropDownStyle={{ backgroundColor: "#fafafa", marginBottom: 40 }}
              onChangeItem={(item) => setBreed(item)}
              isVisible={isBreedVisible}
              onOpen={() => {
                setBreedVisible(true);
                setTypeVisible(false);
                setAgeVisible(false);
              }}
              onClose={() => setBreedVisible(false)}
              zIndex={3000}
            />

            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
              }}
            >
              <Button
                title="Save"
                onPress={() => {
                  console.log(
                    "Age: " + age + ", Type: " + type + ", Breeds: " + breed
                  );
                  searchApi();
                  toggleModal();
                }}
                zIndex={2000}
                containerStyle={{
                  marginTop: 20,
                  marginBottom: 20,
                  marginHorizontal: 20,
                }}
                buttonStyle={{
                  borderRadius: 15,
                  backgroundColor: COLORS.primary,
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
      <View
        style={{
          backgroundColor: "white",
          borderColor: "lightgrey",
          borderWidth: 0,
        }}
      >
        <SearchHeader onPress={toggleModal} />
      </View>
      <View style={{ flex: 1 }}>
        {results ? (
          <Text style={styles.resultStyle}>{results.length} results</Text>
        ) : null}
        <ListComponent
          results={results}
          loadMoreResults={loadMoreResults}
          refresh={searchApi}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  resultStyle: {
    height: 30,
    backgroundColor: "white",
    textAlign: "center",
    fontSize: 16,
    color: "grey",
    paddingTop: 5,
  },
});
export default ListScreen;
