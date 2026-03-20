import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";

export default function ManageCategories() {

  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const addCategory = () => {
    if(category.trim() === "") return;
    setCategories([...categories, category]);
    setCategory("");
  };

  const deleteCategory = (index:number) => {
    const updated = categories.filter((_,i)=> i !== index);
    setCategories(updated);
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Manage Categories</Text>

      <TextInput
        placeholder="Enter category name"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />

      <TouchableOpacity style={styles.addButton} onPress={addCategory}>
        <Text style={{color:"#fff"}}>Add Category</Text>
      </TouchableOpacity>

      <FlatList
        data={categories}
        keyExtractor={(item,index)=> index.toString()}
        renderItem={({item,index}) => (
          <View style={styles.row}>
            <Text style={styles.category}>{item}</Text>

            <TouchableOpacity onPress={()=> deleteCategory(index)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>

          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({

container:{
flex:1,
padding:20,
backgroundColor:"#F2F8F8"
},

title:{
fontSize:22,
fontWeight:"bold",
marginBottom:20
},

input:{
borderWidth:1,
borderColor:"#ddd",
padding:12,
borderRadius:10,
marginBottom:10,
backgroundColor:"#fff"
},

addButton:{
backgroundColor:"#1C8C8C",
padding:15,
borderRadius:10,
alignItems:"center",
marginBottom:20
},

row:{
flexDirection:"row",
justifyContent:"space-between",
backgroundColor:"#fff",
padding:12,
borderRadius:10,
marginBottom:10
},

category:{
fontSize:16
},

delete:{
color:"red",
fontWeight:"bold"
}

});