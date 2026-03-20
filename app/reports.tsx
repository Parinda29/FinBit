import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function Reports() {

 const [incomeData, setIncomeData] = useState<number[]>([]);
 const [expenseData, setExpenseData] = useState<number[]>([]);

 const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

 useEffect(() => {
  fetchTransactions();
 }, []);

 const fetchTransactions = async () => {
  try {

   const response = await fetch("http://YOUR_BACKEND_API/transactions/");
   const data = await response.json();

   const incomeMonthly = new Array(12).fill(0);
   const expenseMonthly = new Array(12).fill(0);

   data.forEach((transaction:any) => {

    const month = new Date(transaction.date).getMonth();

    if(transaction.type === "income"){
     incomeMonthly[month] += transaction.amount;
    }

    if(transaction.type === "expense"){
     expenseMonthly[month] += transaction.amount;
    }

   });

   setIncomeData(incomeMonthly);
   setExpenseData(expenseMonthly);

  } catch(error){
   console.log(error);
  }
 };

 return (

  <View style={styles.container}>

   <Text style={styles.title}>Monthly Report</Text>

   <LineChart
    data={{
     labels: months,
     datasets:[
      {
       data: incomeData
      },
      {
       data: expenseData
      }
     ],
     legend:["Income","Expenses"]
    }}
    width={screenWidth - 20}
    height={260}
    chartConfig={{
     backgroundColor:"#ffffff",
     backgroundGradientFrom:"#ffffff",
     backgroundGradientTo:"#ffffff",
     decimalPlaces:0,
     color:(opacity=1)=>`rgba(23,60,60,${opacity})`,
     labelColor:(opacity=1)=>`rgba(23,60,60,${opacity})`,
     style:{borderRadius:16}
    }}
    style={{marginVertical:20,borderRadius:16}}
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
  color:"#173C3C"
 }

});