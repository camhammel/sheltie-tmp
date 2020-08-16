import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { ListItem } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";
import { Asset } from "expo-asset";
import { COLORS } from "../assets/colors";

const defaultURI = Asset.fromModule(require("../assets/default.png")).uri;

const ListComponent = ({ results, loadMoreResults }) => {
  const navigation = useNavigation();
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const renderItem = ({ item }) => (
    <ListItem
      title={capitalizeFirstLetter(item.name.toLowerCase())}
      titleStyle={styles.titleStyle}
      id={item.id}
      subtitle={item.breeds.primary}
      subtitleStyle={{ color: "grey" }}
      leftAvatar={{
        source: {
          uri: item?.photos?.[0]?.small ?? defaultURI,
        },
        size: "large",
      }}
      bottomDivider
      chevron
      onPress={() => {
        navigation.navigate("PetDetail", {
          item,
          name: item.name,
          breed: item.breeds.primary,
        });
      }}
    />
  );

  if (loadMoreResults != null) {
    return (
      <View style={styles.container}>
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          onEndReachedThreshold={0.01}
          onEndReached={() => {
            loadMoreResults();
          }}
        />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  titleStyle: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 18,
  },
  container: {
    flex: 1,
    marginTop: 0,
  },
  item: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
});

export default ListComponent;
