import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import nasaApi from "../../api/nasaApi";

type Props = NativeStackScreenProps<RootStackParamList, "AboutScreen">;

type Apod = {
  title: string;
  date: string;
  explanation: string;
  url: string;
  media_type: string;
};

export default function AboutScreen({ navigation, route }: Props) {
  const { date } = route.params;

  const [apod, setApod] = useState<Apod | null>(null);
  const [carregando, setCarregando] = useState(true);

  // O JavaScript interpreta a data como uma data em UTC. No horário do Brasil, isso pode virar o dia anterior
  const [ano, mes, dia] = date.split("-").map(Number);
  const [currentDate, setCurrentDate] = useState(new Date(ano, mes - 1, dia));
  function formatarDataAPI(data: Date) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  async function buscarApod(data: Date) {
    try {
      setCarregando(true);

      const dataFormatada = formatarDataAPI(data);

      const resposta = await nasaApi.get<Apod>("/planetary/apod", {
        params: {
          api_key: process.env.EXPO_PUBLIC_API_KEY,
          date: dataFormatada,
        },
      });

      setApod(resposta.data);
    } catch (erro) {
      console.log("Erro ao buscar APOD:", erro);
      setApod(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarApod(currentDate);
  }, [currentDate]);

  function previousDay() {
    const novaData = new Date(currentDate);

    novaData.setDate(novaData.getDate() - 1);

    setCurrentDate(novaData);
  }

  function nextDay() {
    const novaData = new Date(currentDate);

    novaData.setDate(novaData.getDate() + 1);

    setCurrentDate(novaData);
  }

  function formatarData(data: string) {
    const [ano, mes, dia] = data.split("-");

    return `${dia} ${mes}`;
  }

  const hoje = new Date();

  const dataHoje = formatarDataAPI(hoje);
  const dataAtual = formatarDataAPI(currentDate);

  const isToday = dataAtual === dataHoje;

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!apod) {
    return (
      <View style={styles.loading}>
        <Text style={styles.erro}>Não foi possível carregar a imagem.</Text>

        <Pressable
          style={styles.voltarErro}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.textoBotao}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* IMAGEM DA NASA */}
      {apod!.media_type === "image" && (
        <Image
          source={{ uri: apod.url }}
          style={styles.imagem}
          resizeMode="cover"
        />
      )}

      {/* BOTÃO VOLTAR */}
      <Pressable style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
        <Text style={styles.seta}>‹</Text>
      </Pressable>

      {/* ANO */}
      <Text style={styles.ano}>{apod.date.split("-")[0]}</Text>

      {/* NASA */}
      <Image
        style={styles.logo}
        resizeMode="contain"
        source={require("../../assets/logo.webp")}
      />

      {/* CARD */}
      <View style={styles.card}>
        <View style={styles.indicador} />

        {/* TÍTULO + DATA */}
        <View style={styles.cabecalho}>
          <Text style={styles.titulo}>{apod.title}</Text>

          <Text style={styles.data}>{formatarData(apod.date)}</Text>
        </View>

        {/* DESCRIÇÃO */}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.descricao}>{apod.explanation}</Text>
        </ScrollView>

        {/* NAVEGAÇÃO */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={previousDay}>
            <Text style={styles.buttonText}>← Anterior</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isToday && styles.disabledButton]}
            onPress={nextDay}
            disabled={isToday}
          >
            <Text style={styles.buttonText}>Próxima →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080A3A",
  },
  logo: {
    width: "100%",
    height: "10%",
  },

  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "rgb(42, 31, 71),80,80,0.75)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  disabledButton: {
    opacity: 0.4,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  imagem: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "60%",
  },

  botaoVoltar: {
    position: "absolute",
    top: 50,
    left: 22,
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: "rgba(80,80,80,0.75)",
    justifyContent: "center",
    alignItems: "center",

    zIndex: 10,
    elevation: 10,
  },

  seta: {
    color: "#fff",
    fontSize: 27,
    lineHeight: 27,
    marginTop: -3,
  },

  ano: {
    position: "absolute",
    top: 50,
    right: 22,
    color: "#fff",
    fontSize: 12,
    opacity: 0.7,
  },

  nasa: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -2,
  },

  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    height: "57%",

    backgroundColor: "#080A3A",

    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,

    paddingHorizontal: 24,
    paddingTop: 10,
  },

  indicador: {
    width: 50,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#777",
    alignSelf: "center",
    marginBottom: 18,
  },

  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  titulo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "400",
    flex: 1,
    marginRight: 15,
  },

  data: {
    color: "#fff",
    fontSize: 19,
    textAlign: "right",
    width: 48,
    lineHeight: 22,
  },

  scroll: {
    flex: 1,
    marginBottom: 12,
  },

  descricao: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 17,
    opacity: 0.95,
  },

  navegacao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 18,
  },

  botaoNavegacao: {
    backgroundColor: "#15194F",
    height: 30,
    minWidth: 108,
    borderRadius: 20,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingHorizontal: 10,
  },

  textoNavegacao: {
    color: "#fff",
    fontSize: 11,
    marginHorizontal: 5,
  },

  setaBotao: {
    color: "#fff",
    fontSize: 15,
  },

  loading: {
    flex: 1,
    backgroundColor: "#080A3A",
    justifyContent: "center",
    alignItems: "center",
  },

  erro: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },

  voltarErro: {
    backgroundColor: "#15194F",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },

  textoBotao: {
    color: "#fff",
  },
});
