import React from 'react';
import AppTabs from './AppTabs'; 
import { NavigationContainer } from "@react-navigation/native";

export default function Routes(){
    return(
        <NavigationContainer>
            <AppTabs/>
        </NavigationContainer>
    )
}
