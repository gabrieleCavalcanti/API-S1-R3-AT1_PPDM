import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, NasaImage } from "../../types/navigation";
import apiNasa from "../../api/nasaApi";

type Props = NativeStackScreenProps<RootStackParamList, "HomeScreen">;

export default function HomeScreen({ navigation }: Props) {
  const [imagens, setImagens] = useState<NasaImage[]>([]);
  const [imagensFiltradas, setImagensFiltradas] = useState<NasaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  useEffect(() => {
    buscarImagens();
  }, []);

  useEffect(() => {
    let resultado = [...imagens];

    // FILTRO POR NOME
    if (pesquisa.trim()) {
      const texto = pesquisa.toLowerCase().trim();

      resultado = resultado.filter((item) =>
        item.title.toLowerCase().includes(texto)
      );
    }

    // FILTRO POR DATA
    if (dataFiltro) {
      resultado = resultado.filter(
        (item) => item.date === dataFiltro
      );
    }

    setImagensFiltradas(resultado);


  }, [pesquisa, dataFiltro, imagens]);

  async function buscarImagens() {
    try {
      setLoading(true);
      setErro("");

      const hoje = new Date();

      const dataFinal = hoje.toISOString().split("T")[0];

      const dataInicialDate = new Date(hoje);

      dataInicialDate.setDate(
        dataInicialDate.getDate() - 130
      );

      const dataInicial =
        dataInicialDate.toISOString().split("T")[0];

      const response = await apiNasa.get("/planetary/apod", {
        params: {
          start_date: dataInicial,
          end_date: dataFinal,
        },
      });

      const dados: NasaImage[] = Array.isArray(response.data)
        ? response.data
        : [response.data];

      // SOMENTE IMAGENS
      const somenteImagens = dados.filter(
        (item) =>
          item.media_type === "image" &&
          !!item.url
      );

      // REMOVE DUPLICADAS
      const mapaPorData = new Map<string, NasaImage>();

      for (const item of somenteImagens) {
        if (!mapaPorData.has(item.date)) {
          mapaPorData.set(item.date, item);
        }
      }

      // ORDENA DA MAIS RECENTE PARA A MAIS ANTIGA
      const imagensOrdenadas = Array.from(
        mapaPorData.values()
      ).sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );

      const primeiras100 = imagensOrdenadas.slice(0, 200);

      setImagens(primeiras100);
      setImagensFiltradas(primeiras100);
    } catch (error: any) {
      console.error(
        "Erro completo:",
        error?.response?.data || error
      );

      setErro(
        "Não foi possível carregar as imagens."
      );
    } finally {
      setLoading(false);
    }
  }

  // ABRIR ABOUT
  function abrirAbout(item: NasaImage) {
    navigation.navigate("AboutScreen", {
      date: item.date,
    });
  }

  // SELECIONAR DATA
  function selecionarData(
    event: any,
    date?: Date
  ) {
    if (Platform.OS === "android") {
      setMostrarCalendario(false);
    }

    if (!date) {
      return;
    }

    const ano = date.getFullYear();

    const mes = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
      date.getDate()
    ).padStart(2, "0");

    const dataISO = `${ano}-${mes}-${dia}`;

    setDataSelecionada(date);
    setDataFiltro(dataISO);

    // Abre o AboutScreen da data selecionada
    navigation.navigate("AboutScreen", {
      date: dataISO,
    });
  }


  // LIMPAR FILTROS
  function limparFiltros() {
    setPesquisa("");
    setDataFiltro("");
    setDataSelecionada(null);
  }

  // TEXTO MOSTRADO NO CAMPO DE DATA
  function textoData() {
    if (!dataSelecionada) {
      return "Selecionar data";
    }

    return formatarData(
      dataFiltro
    );


  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />

        <Text style={styles.loadingText}>
          Carregando imagens...
        </Text>
      </View>
    );


  }

  if (erro) {
    return (
      <View style={styles.loading}>
        <Text style={styles.erro}>
          {erro}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* LUA */}
      <Image
        source={require("../../assets/lua.webp")}
        style={styles.lua}
        resizeMode="contain"
      />

      <View style={styles.conteudo}>

        {/* LOGO */}
        <Image
          source={require("../../assets/logo.webp")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* FILTROS LADO A LADO */}
        <View style={styles.filtrosLinha}>

          {/* PESQUISA */}
          <View style={styles.pesquisaContainer}>
            <TextInput
              style={styles.pesquisa}
              placeholder="Pesquisar..."
              placeholderTextColor="#9ca3af"
              value={pesquisa}
              onChangeText={setPesquisa}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* SELETOR DE DATA */}
          <TouchableOpacity
            style={styles.filtroData}
            onPress={() =>
              setMostrarCalendario(true)
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.textoData,
                !dataSelecionada &&
                styles.textoDataPlaceholder,
              ]}
            >
              {textoData()}
            </Text>
          </TouchableOpacity>

        </View>

        {/* CALENDÁRIO */}
        {mostrarCalendario && (
          <View style={styles.calendarioContainer}>
            <DateTimePicker
              value={
                dataSelecionada ||
                new Date()
              }
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              maximumDate={new Date()}
              onChange={selecionarData}
              themeVariant="dark"
            />

            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={styles.botaoConfirmar}
                onPress={() =>
                  setMostrarCalendario(false)
                }
                activeOpacity={0.7}
              >
                <Text style={styles.textoConfirmar}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* LIMPAR FILTROS */}
        {(pesquisa.length > 0 ||
          dataFiltro.length > 0) && (
            <TouchableOpacity
              style={styles.botaoLimpar}
              onPress={limparFiltros}
              activeOpacity={0.7}
            >
              <Text style={styles.textoLimpar}>
                Limpar filtros
              </Text>
            </TouchableOpacity>
          )}

        {/* LISTA */}
        <FlatList
          data={imagensFiltradas}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"

          renderItem={({ item }) => (
            <View style={styles.card}>

              {/* CABEÇALHO */}
              <View style={styles.cabecalhoCard}>

                {/* NOME E DATA */}
                <View style={styles.infoCard}>

                  <Text
                    style={styles.nome}
                    numberOfLines={4}
                  >
                    {item.title}
                  </Text>

                  <Text style={styles.data}>
                    {formatarData(item.date)}
                  </Text>

                </View>

                {/* BOTÃO */}
                <TouchableOpacity
                  style={styles.botaoSeta}
                  onPress={() =>
                    abrirAbout(item)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.seta}>
                    →
                  </Text>
                </TouchableOpacity>

              </View>

              {/* IMAGEM */}
              <Image
                source={{
                  uri: item.url,
                }}
                style={styles.imagem}
                resizeMode="cover"
              />

            </View>
          )}

          ListEmptyComponent={
            <View style={styles.semResultados}>
              <Text
                style={
                  styles.semResultadosTexto
                }
              >
                Nenhuma imagem encontrada.
              </Text>
            </View>
          }
        />

      </View>
    </View>


  );
}

// FORMATA AAAA-MM-DD PARA DD/MM/AAAA
function formatarData(data: string) {
  if (!data) {
    return "";
  }

  const partes = data.split("-");

  if (partes.length !== 3) {
    return data;
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },

  lua: {
    position: "absolute",
    width: 800,
    height: 800,
    right: -198,
    top: 80,
    opacity: 0.9,
  },

  conteudo: {
    flex: 1,
    paddingTop: 15,
  },

  logo: {
    width: "85%",
    height: 100,
    alignSelf: "center",
    marginBottom: 0,
    marginTop:32
  },

  /* =========================
  FILTROS
  ========================= */

  filtrosLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 0,
    marginBottom: 8,
    gap: 8,
  },

  pesquisaContainer: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor:
      "rgba(17, 24, 39, 0.35)",
    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
  },

  pesquisa: {
    color: "#fff",
    fontSize: 14,
  },

  /* =========================
  DATA
  ========================= */

  filtroData: {
    flex: 0.85,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor:
      "rgba(17, 24, 39, 0.35)",
    borderWidth: 1,
    borderColor:
      "rgba(165, 180, 252, 0.35)",
    borderRadius: 12,
  },

  textoData: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  textoDataPlaceholder: {
    color: "#8b93a7",
    fontWeight: "400",
  },

  /* =========================
  CALENDÁRIO
  ========================= */

  calendarioContainer: {
    marginHorizontal: 15,
    marginBottom: 8,
    alignItems: "center",
    backgroundColor:
      "rgba(17, 24, 39, 0.85)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      "rgba(165, 180, 252, 0.25)",
    paddingVertical: 5,
  },

  botaoConfirmar: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor:
      "rgba(99, 102, 241, 0.65)",
  },

  textoConfirmar: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  /* =========================
  BOTÃO LIMPAR
  ========================= */

  botaoLimpar: {
    height: 34,
    marginHorizontal: 15,
    marginBottom: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(99, 102, 241, 0.45)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      "rgba(165, 180, 252, 0.45)",
  },

  textoLimpar: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  /* =========================
  LISTA
  ========================= */

  lista: {
    paddingBottom: 30,
  },

  /* =========================
  CARD
  ========================= */

  card: {
    marginHorizontal: 15,
    marginBottom: 20,
    paddingBottom: 16,
    backgroundColor:
      "rgba(17, 24, 39, 0.16)",
    borderWidth: 1,
    borderColor:
      "rgba(255, 255, 255, 0.12)",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 7,
  },

  /* =========================
  CABEÇALHO
  ========================= */

  cabecalhoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 14,
  },

  infoCard: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  nome: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "left",
    flexShrink: 1,
  },

  data: {
    color: "#a5b4fc",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 7,
    textAlign: "left",
  },

  /* =========================
  BOTÃO SETA
  ========================= */

  botaoSeta: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(99, 102, 241, 0.50)",
    borderWidth: 1,
    borderColor:
      "rgba(165, 180, 252, 0.50)",
    flexShrink: 0,
    marginTop: 2,
  },

  seta: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: -2,
  },

  /* =========================
  IMAGEM
  ========================= */

  imagem: {
    width: "90%",
    height: 220,
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor:
      "rgba(31, 41, 55, 0.30)",
  },

  /* =========================
  SEM RESULTADOS
  ========================= */

  semResultados: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },

  semResultadosTexto: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
  },

  /* =========================
  LOADING
  ========================= */

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050816",
    paddingHorizontal: 20,
  },

  loadingText: {
    color: "#fff",
    fontSize: 17,
    marginTop: 15,
    textAlign: "center",
  },

  /* =========================
  ERRO
  ========================= */

  erro: {
    color: "#ff5555",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});