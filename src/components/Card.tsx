import { PropsWithChildren } from "react";
import { TextStyle, PressableProps, useColorScheme, ViewStyle, View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { MayanColors, Colors } from '@/src/constants/theme';




interface CardProps extends PressableProps {
    title: string;
    description: string;
    icon: string;
    color?: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary';
}

export function Card({ title, description, icon, color, style, textStyle, variant = 'primary', ...props }: CardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const defaultBackgroundColor = variant === 'primary'
        ? (isDark ? '#2a2c2a' : '#ffffff')
        : 'transparent';

    const defaultBorderColor = variant === 'secondary'
        ? MayanColors.jade
        : 'transparent';

    const textColor = variant === 'primary'
        ? Colors[isDark ? 'dark' : 'light'].text
        : Colors[isDark ? 'dark' : 'light'].text;

    const iconColor = color || (variant === 'primary' ? MayanColors.jade : (isDark ? Colors.dark.icon : Colors.light.icon));

    const iconContainerBg = color ? `${color}20` : (isDark ? '#2a2c2a' : '#ffebd6');
    const pressedBg = color ? `${color}10` : (isDark ? '#3a3c3a' : '#f0f0f0');

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                {
                    backgroundColor: defaultBackgroundColor,
                    borderColor: pressed ? iconColor : defaultBorderColor,
                    borderWidth: variant === 'secondary' ? 2 : 1
                },
                style
            ]}
            {...props}
        >
            {({ pressed }) => (
                <>
                    {/* Overlay semitransparente para el estado presionado */}
                    {pressed && (
                        <View
                            style={[
                                StyleSheet.absoluteFillObject,
                                { backgroundColor: pressedBg, borderRadius: 16 }
                            ]}
                        />
                    )}

                    {/* Contenedor del ícono circular */}
                    <View style={[styles.iconContainer, { backgroundColor: iconContainerBg }]}>
                        <MaterialIcons name={icon as any} size={24} color={iconColor} />
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: textColor }, textStyle]}>
                            {title}
                        </Text>
                        <Text style={[styles.description, { color: Colors[isDark ? 'dark' : 'light'].icon }]}>
                            {description}
                        </Text>
                    </View>
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignSelf: 'stretch',
        minHeight: 180,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    textContainer: {
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
    },
});
