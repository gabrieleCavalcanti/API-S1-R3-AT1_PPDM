import { useEffect, useState } from "react";
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";

import nasaApi from "../../api/nasaApi";

type Props = NativeStackScreenProps<RootStackParamList, "InicioScreen">;

type Apod = {
  title: string;
  date: string;
  explanation: string;
  url: string;
  media_type: string;
};

export default function InicioScreen({ navigation }: Props) {
  const [apod, setApod] = useState<Apod | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function buscarFotoDoDia() {
    try {
      const resposta = await nasaApi.get<Apod>("/planetary/apod", {
        params: {
          api_key: process.env.EXPO_PUBLIC_API_KEY,
        },
      });

      setApod(resposta.data);
    } catch (erro) {
      console.log("Erro ao buscar foto da NASA:", erro);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarFotoDoDia();
  }, []);

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {apod && apod.media_type === "image" && (
        <Image
          source={{ uri: apod.url }}
          style={styles.fundo}
          resizeMode="cover"
        />
      )}

      <Pressable
        style={styles.botaoLogo}
        onPress={() => navigation.navigate("HomeScreen")}
      >
        <Image
          style={styles.logo}
          resizeMode="contain"
          source={require("../../assets/logo.webp")}
        />
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  fundo: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  botaoLogo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 220,
    height: 120,
    transform: [
      { translateX: -110 },
      { translateY: -60 },
    ],
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});