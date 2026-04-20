import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

// --- DATA MODEL (Basado en Schema MexFood) ---
type Platillo = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  nivelPicante: 'Nulo' | 'Bajo' | 'Medio' | 'Alto';
  aptoVegetariano: boolean;
  imagen: string;
  riesgoDigestivo: 'Bajo' | 'Medio' | 'Alto';
};

const PLATILLOS: Platillo[] = [
  {
    id: 'p1',
    nombre: 'Tacos al Pastor',
    categoria: 'Platos Fuertes',
    descripcion: 'Tacos de cerdo marinado con trompo, piña, cilantro y cebolla.',
    nivelPicante: 'Medio',
    aptoVegetariano: false,
    imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    riesgoDigestivo: 'Medio',
  },
  {
    id: 'p2',
    nombre: 'Guacamole Tradicional',
    categoria: 'Entradas',
    descripcion: 'Aguacate fresco machacado con tomate, cebolla, limón y chile.',
    nivelPicante: 'Bajo',
    aptoVegetariano: true,
    imagen: 'https://images.unsplash.com/photo-1525385966453-611b8ca60114?w=400',
    riesgoDigestivo: 'Bajo',
  },
  {
    id: 'p3',
    nombre: 'Enchiladas Verdes',
    categoria: 'Platos Fuertes',
    descripcion: 'Tortillas rellenas bañadas en salsa verde con queso y crema.',
    nivelPicante: 'Alto',
    aptoVegetariano: false,
    imagen: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400',
    riesgoDigestivo: 'Alto',
  },
  {
    id: 'p4',
    nombre: 'Churros con Azúcar',
    categoria: 'Postres',
    descripcion: 'Masa frita espolvoreada con azúcar y canela, crujientes.',
    nivelPicante: 'Nulo',
    aptoVegetariano: true,
    imagen: 'https://images.unsplash.com/photo-1481522510795-1db682283907?w=400',
    riesgoDigestivo: 'Medio',
  }
];

export default function App() {
  const [search, setSearch] = useState('');
  const [soloVegetariano, setSoloVegetariano] = useState(false);
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null);
  const [notes, setNotes] = useState('');
  const [thumbUp, setThumbUp] = useState(false);
  const [thumbDown, setThumbDown] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- FILTROS (useMemo) ---
  const filteredPlatillos = useMemo(() => {
    return PLATILLOS.filter((p) => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase().trim());
      const matchVeg = !soloVegetariano || p.aptoVegetariano;
      return matchSearch && matchVeg;
    });
  }, [search, soloVegetariano]);

  // --- SECCIONES (Para el componente SectionList) ---
  const categoriasSection = [
    { title: 'Entradas', data: PLATILLOS.filter(p => p.categoria === 'Entradas') },
    { title: 'Platos Fuertes', data: PLATILLOS.filter(p => p.categoria === 'Platos Fuertes') },
    { title: 'Postres', data: PLATILLOS.filter(p => p.categoria === 'Postres') },
  ].filter(section => section.data.length > 0);

  const simulateSearch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor="#006341" />
      
      {/* Header Falso */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MexFood FIFA 2026</Text>
        <Text style={styles.headerSubtitle}>Recomendaciones para Turistas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* COMPONENTES: TextInput, Switch */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Buscar y Filtrar</Text>
          <TextInput
            placeholder="Ej. Tacos, Guacamole..."
            placeholderTextColor="#888"
            style={styles.input}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              if(text.length > 2) simulateSearch();
            }}
          />
          <View style={styles.switchRow}>
            <Text style={styles.textBold}>Solo Apto Vegetariano</Text>
            <Switch 
              value={soloVegetariano} 
              onValueChange={setSoloVegetariano} 
              trackColor={{ false: '#ccc', true: '#006341' }} 
            />
          </View>
          {loading && <ActivityIndicator size="small" color="#006341" style={{marginTop: 10}}/>}
        </View>

        {/* COMPONENTES: FlatList, Image, Pressable */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recomendaciones (FlatList)</Text>
          <FlatList
            data={filteredPlatillos}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable style={styles.itemRow} onPress={() => setSelectedPlatillo(item)}>
                <Image source={{ uri: item.imagen }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.nombre}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.descripcion}</Text>
                  <Text style={styles.itemSpicy}>🌶️ Picante: {item.nivelPicante}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay resultados.</Text>}
          />
        </View>

        {/* COMPONENTES: SectionList */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Menú por Categorías (SectionList)</Text>
          <SectionList
            sections={categoriasSection}
            keyExtractor={(item) => `sec-${item.id}`}
            scrollEnabled={false}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <Pressable style={styles.sectionItem} onPress={() => setSelectedPlatillo(item)}>
                <Text style={styles.sectionItemText}>• {item.nombre}</Text>
              </Pressable>
            )}
          />
        </View>

        {/* COMPONENTES: Feedback, Controles de usuario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Feedback del Turista</Text>
          <Text style={styles.textLabel}>¿Fue útil la recomendación del motor?</Text>
          <View style={styles.feedbackRow}>
            <Pressable
              style={[styles.btnThumb, thumbUp && styles.btnThumbActiveUp]}
              onPress={() => { setThumbUp(true); setThumbDown(false); }}
            >
              <Text style={[styles.btnThumbText, thumbUp && styles.btnThumbTextActive]}>Útil</Text>
            </Pressable>
            <Pressable
              style={[styles.btnThumb, thumbDown && styles.btnThumbActiveDown]}
              onPress={() => { setThumbDown(true); setThumbUp(false); }}
            >
              <Text style={[styles.btnThumbText, thumbDown && styles.btnThumbTextActive]}>No útil</Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="Comentarios adicionales o incidencias con el turista..."
            placeholderTextColor="#888"
            style={[styles.input, styles.textArea]}
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <Pressable
            style={styles.btnPrimary}
            onPress={() => Alert.alert('Feedback Guardado', 'Los datos servirán para mejorar el algoritmo en FIFA 2026.')}
          >
            <Text style={styles.btnPrimaryText}>Enviar Feedback</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* COMPONENTES: Modal */}
      <Modal
        transparent
        visible={Boolean(selectedPlatillo)}
        animationType="slide"
        onRequestClose={() => setSelectedPlatillo(null)}
      >
        {selectedPlatillo && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedPlatillo.imagen }} style={styles.modalImage} />
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedPlatillo.nombre}</Text>
                <Text style={styles.modalCategory}>{selectedPlatillo.categoria}</Text>
                
                <Text style={styles.modalDesc}>{selectedPlatillo.descripcion}</Text>
                
                <View style={styles.modalDataRow}>
                  <Text style={styles.textBold}>🌶️ Picante:</Text>
                  <Text>{selectedPlatillo.nivelPicante}</Text>
                </View>
                <View style={styles.modalDataRow}>
                  <Text style={styles.textBold}>🌿 Vegetariano:</Text>
                  <Text>{selectedPlatillo.aptoVegetariano ? 'Sí' : 'No'}</Text>
                </View>
                <View style={styles.modalDataRow}>
                  <Text style={styles.textBold}>⚠️ Riesgo Digestivo:</Text>
                  <Text>{selectedPlatillo.riesgoDigestivo}</Text>
                </View>

                <Pressable style={styles.btnClose} onPress={() => setSelectedPlatillo(null)}>
                  <Text style={styles.btnCloseText}>Cerrar Detalle</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: '#006341',
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: '#e0e0e0', fontSize: 14 },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#B3282D', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fafafa', color: '#333'
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', marginTop: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  textBold: { fontWeight: '600', color: '#333' },
  textLabel: { color: '#555', marginBottom: 8 },
  emptyText: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 10 },
  
  itemRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, gap: 12
  },
  itemImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#ccc' },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  itemDesc: { fontSize: 13, color: '#666', marginVertical: 4 },
  itemSpicy: { fontSize: 12, color: '#d97706', fontWeight: '600' },

  sectionHeader: { backgroundColor: '#f8f9fa', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginTop: 8 },
  sectionHeaderText: { fontWeight: 'bold', color: '#006341' },
  sectionItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionItemText: { color: '#444' },

  feedbackRow: { flexDirection: 'row', gap: 10 },
  btnThumb: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center' },
  btnThumbActiveUp: { backgroundColor: '#10b981', borderColor: '#10b981' },
  btnThumbActiveDown: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  btnThumbText: { fontWeight: '600', color: '#555' },
  btnThumbTextActive: { color: '#fff' },
  btnPrimary: { backgroundColor: '#006341', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalImage: { width: '100%', height: 200, backgroundColor: '#ccc' },
  modalBody: { padding: 20, gap: 12 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  modalCategory: { fontSize: 14, color: '#B3282D', fontWeight: 'bold', textTransform: 'uppercase' },
  modalDesc: { fontSize: 15, color: '#555', lineHeight: 22 },
  modalDataRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  btnClose: { backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnCloseText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
