import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  useWindowDimensions,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, Button, Input } from "react-native-elements";
import ListComponent from "../components/ListComponent";
import SearchHeader from "../components/SearchHeader";
import petfinder from "../api/petfinder";
import * as Location from "expo-location";
import { COLORS } from "../assets/colors";
import MySlider from "../components/MySlider";
import DropDownPicker from "react-native-dropdown-picker";
import requestAccess from "../api/requestAccess";

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const ListScreen = ({ navigation }) => {
  const [searchReq, setSearchReq] = useState("");
  const [distance, setDistance] = useState(150);
  const [age, setAge] = useState([]);
  const [type, setType] = useState("");
  const [breed, setBreed] = useState([]);
  const [breedOptions, setBreedOptions] = useState([]);
  const [location, setLocation] = useState(null);
  const [customLocation, setCustomLocation] = useState("");
  const [CustomLocationErrorMessage, setCustomLocationErrorMessage] = useState("");
  const [results, setResults] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isTypeVisible, setTypeVisible] = useState(false);
  const [isBreedVisible, setBreedVisible] = useState(false);
  const [isAgeVisible, setAgeVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [nextPage, setNextPage] = useState(2);
  const flatListRef = useRef();
  const customLocationRef = useRef();

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  useEffect(() => {
    (async () => {
      setBreed([]);
      await getBreedOptions();
    })();
  }, [type]);

  const searchApi = async () => {
    setNextPage(2);
    let search = "";

    if (customLocation != "") {
      Location.geocodeAsync(customLocation).then((cust) => {
        if (cust[0]?.latitude == null) {
          setCustomLocationErrorMessage(
            "Sorry, we couldn't find any results from this location. To use your current location, keep this blank."
          );
          setTimeout(() => {
            setModalVisible(true);
            customLocationRef?.current?.focus();
          }, 500);
        } else {
          setSearchReq(
            `animals?type=${type}&limit=50&location=${cust[0].latitude},${cust[0].longitude}&sort=distance&age=${age}&distance=${distance}&breed=${breed}`
          );
          search = `animals?type=${type}&limit=50&location=${cust[0].latitude},${cust[0].longitude}&sort=distance&age=${age}&distance=${distance}&breed=${breed}`;

          (async () => {
            petfinder
              .get(search, {
                headers: {
                  Authorization: `Bearer ${(
                    await AsyncStorage.getItem("token")
                  ).toString()}`,
                },
              })
              .then((response) => {
                setResults(response.data.animals);
                AsyncStorage.setItem(
                  "lastpets",
                  JSON.stringify(response.data.animals)
                );
                AsyncStorage.setItem("lastsearch", JSON.stringify(this_search));
              })
              .catch(async function (error) {
                if (error.response) {
                }
                if (error.response.data.status == 401) {
                  await requestAccess();
                } else if (error.response.data.status == 400) {
                  setCustomLocationErrorMessage(
                    "Invalid location. Be sure to use the [city, state] format, such as Orlando, FL"
                  );
                  setTimeout(() => {
                    setModalVisible(true);
                    customLocationRef?.current?.focus();
                  }, 500);
                }
              });
          })();
        }
      });
    } else {
      setSearchReq(
        `animals?type=${type}&limit=50&location=${location.coords.latitude},${location.coords.longitude}&sort=distance&age=${age}&distance=${distance}&breed=${breed}`
      );
      search = `animals?type=${type}&limit=50&location=${location.coords.latitude},${location.coords.longitude}&sort=distance&age=${age}&distance=${distance}&breed=${breed}`;
      petfinder
        .get(search, {
          headers: {
            Authorization: `Bearer ${(
              await AsyncStorage.getItem("token")
            ).toString()}`,
          },
        })
        .then((response) => {
          setResults(response.data.animals);
          AsyncStorage.setItem(
            "lastpets",
            JSON.stringify(response.data.animals)
          );
          AsyncStorage.setItem("lastsearch", JSON.stringify(this_search));
        })
        .catch(async function (error) {
          if (error.response.data.status == 401) {
            await requestAccess();
          } else if (error.response.data.status == 400) {
            setCustomLocationErrorMessage(
              "Sorry, we couldn't find any results from this location. To use your current location, keep this blank."
            );
            setTimeout(() => {
              setModalVisible(true);
              customLocationRef?.current?.focus();
            }, 500);
          }
        });
    }
    const this_search = {
      customLocation,
      type,
      age,
      distance,
      breed,
    };
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true});
  };

  useEffect(() => {
    if (customLocation != "") {
      navigation.setOptions({
        headerTitle: "Pets near " + customLocation,
        headerTitleStyle: { color: "white" },
      });
    } else {
      navigation.setOptions({
        headerTitle: "Nearby Pets for Adoption",
        headerTitleStyle: { color: "white" },
      });
    }
    if (
      (!results || results.length <= 0) &&
      (location != null || customLocation != "")
    ) {
    }
  }, [location, customLocation]);

  useEffect(() => {
    (async () => {
      let temp = JSON.parse(await AsyncStorage.getItem("lastpets"));
      setResults(temp);

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied. Try again.");
        const { newstatus } = await Permissions.askAsync(Permissions.LOCATION);
        if (!newstatus === "granted") {
          throw new Error("Location permissions not granted.");
        }
      }

      let location2 = await Location.getLastKnownPositionAsync({});
      if (location2 !== null)
        setLocation(location2);

      let temp2 = JSON.parse(await AsyncStorage.getItem("lastsearch"));
      if ((await temp2) != null) {
        setCustomLocation(temp2.customLocation);
        setInputVal(temp2.customLocation);
        setAge(temp2.age);
        setDistance(temp2.distance);
        setType(temp2.type);
        setBreed(temp2.breed);
      } else {
        //
        setType("Dog");
        setModalVisible(true);
        setTimeout(() => {
          Alert.alert(
            "Search Filters",
            "Use these filters to help narrow down your search. When you're ready, click 'Search'. "
          );
        }, 750);
      }
    })();
  }, []);

  const loadMoreResults = async () => {
    if (!loadingMore) {
      setLoadingMore(true);
      retrieveNewPage();
      setNextPage(nextPage + 1);
      setLoadingMore(false);
    }
  };

  const retrieveNewPage = async () => {
    const newpagesearch = searchReq.concat(`&page=${nextPage}`);

    petfinder
      .get(newpagesearch, {
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
        }
      });
  };

  const getBreedOptions = async () => {
    if (type != "") {
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
          setBreedOptions(my_breeds);
        })
        .catch(function (error) {
          if (error.response) {
          }
        });
    } else {
      setTimeout(async () => {
        if (type == "") {
          var breedSearch = `types/dog/breeds`;

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
              setBreedOptions(my_breeds);
            })
            .catch(function (error) {
              if (error.response) {
              }
            });
        }
      }, 500);
    }
  };

  return (
    <View style={{ justifyContent: "flex-start", flex: 1, borderWidth: 0 }}>
      <Modal transparent visible={isModalVisible}>
        <View
          style={{
            borderRadius: 15,
            margin: 20,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowOffset: { height: 10, width: 10 },
            shadowRadius: 4,
            elevation: 5,
            height: useWindowDimensions().height * 0.85,
            backgroundColor: "white",
          }}
        >
          <ScrollView>
            <View
              style={{
                display: "flex",
                height: useWindowDimensions().height * 0.85,
                flex: 1,
                justifyContent: "space-evenly",
              }}
            >
              <View>
                <Text style={styles.labelStyle}>LOCATION</Text>
                <Input
                  inputStyle={{
                    marginLeft: 10,
                    marginTop: 0,
                    marginBottom: 0,
                    fontSize: 18,
                    color: COLORS.darkgrey,
                  }}
                  inputContainerStyle={styles.inputContainerStyle}
                  placeholder="Use Current Location"
                  leftIcon={{
                    type: "font-awesome",
                    name: "globe",
                    color: COLORS.primary,
                  }}
                  leftIconContainerStyle={{ marginLeft: 10 }}
                  onEndEditing={() => {
                    setCustomLocation(inputVal);
                  }}
                  defaultValue={customLocation ? customLocation : ""}
                  textContentType="addressCityAndState"
                  clearButtonMode="always"
                  onChangeText={(text) => {
                    setInputVal(text);
                    setCustomLocationErrorMessage("");
                  }}
                  errorMessage={CustomLocationErrorMessage}
                  errorStyle={{
                    marginLeft: 15,
                    marginBottom: 10,
                  }}
                  value={inputVal}
                  ref={customLocationRef}
                />
              </View>
              <View>
                <MySlider distance={distance} setDistance={setDistance} />
              </View>
              <View>
                <Text style={styles.labelStyle}>AGE</Text>
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
                  dropDownStyle={{
                    backgroundColor: "#fafafa",
                    marginBottom: 40,
                  }}
                  onChangeItem={(item) => setAge(item)}
                  isVisible={isAgeVisible}
                  onOpen={() => {
                    setAgeVisible(true);
                    setTypeVisible(false);
                    setBreedVisible(false);
                  }}
                  onClose={() => setAgeVisible(false)}
                />
              </View>
              <View>
                <Text style={styles.labelStyle}>ANIMAL TYPE</Text>
                <DropDownPicker
                  items={[
                    {
                      label: "Dog",
                      value: "Dog",
                    },
                    {
                      label: "Cat",
                      value: "Cat",
                    },
                    {
                      label: "Bird",
                      value: "Bird",
                    },
                  ]}
                  defaultValue={type}
                  containerStyle={{ height: 40, marginHorizontal: 10 }}
                  style={{ backgroundColor: "#fafafa" }}
                  itemStyle={{
                    justifyContent: "flex-start",
                  }}
                  dropDownStyle={{
                    backgroundColor: "#fafafa",
                  }}
                  onChangeItem={(item) => {
                    setType(item.value);
                  }}
                  isVisible={isTypeVisible}
                  onOpen={() => {
                    setTypeVisible(true);
                    setBreedVisible(false);
                    setAgeVisible(false);
                  }}
                  onClose={() => setTypeVisible(false)}
                />
              </View>
              <View>
                <Text style={styles.labelStyle}>ANIMAL BREEDS</Text>
                <DropDownPicker
                  items={breedOptions ? breedOptions : []}
                  defaultValue={breed ? breed : ""}
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
                  dropDownStyle={{
                    backgroundColor: "#fafafa",
                    marginBottom: 40,
                  }}
                  onChangeItem={(item) => setBreed(item)}
                  isVisible={isBreedVisible}
                  onOpen={() => {
                    setBreedVisible(true);
                    setTypeVisible(false);
                    setAgeVisible(false);
                  }}
                  onClose={() => setBreedVisible(false)}
                />
              </View>
              <View>
                <Button
                  title="Clear Filters"
                  onPress={() => {
                    setCustomLocation("");
                    setInputVal("");
                    setDistance(150);
                    setBreed([]);
                    setAge([]);
                    setType("Dog");
                  }}
                  containerStyle={{
                    marginTop: 20,
                    marginHorizontal: 20,
                  }}
                  buttonStyle={{
                    borderRadius: 15,
                    backgroundColor: "grey",
                  }}
                />
                <Button
                  title="Search"
                  onPress={() => {
                    searchApi();
                    toggleModal();
                  }}
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
          </ScrollView>
        </View>
      </Modal>
      <View
        style={{
          backgroundColor: "white",
          borderColor: "lightgrey",
          borderWidth: 0,
        }}
      >
        <SearchHeader
          onPress={() => toggleModal()}
          location={{
            lat: location?.coords?.latitude,
            long: location?.coords?.longitude,
          }}
        />
      </View>
      <View style={{ flex: 1 }}>
        {results ? (
          <Text style={styles.resultStyle}>{results.length} results</Text>
        ) : null}
        <ListComponent
          results={results}
          loadMoreResults={loadMoreResults}
          refresh={searchApi}
          ref={flatListRef}
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
  labelStyle: {
    fontWeight: "bold",
    fontSize: 20,
    color: COLORS.primary,
    marginLeft: 15,
    marginBottom: 5,
    marginTop: 20,
  },
  inputStyle: {
    borderRadius: 8,
    paddingHorizontal: 10,
    color: COLORS.darkgrey,
  },
  inputContainerStyle: {
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  inputLabelStyle: {
    marginLeft: 10,
    marginBottom: 5,
    marginTop: 5,
  },
});
export default ListScreen;
