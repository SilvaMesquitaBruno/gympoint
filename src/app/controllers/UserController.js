import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const { email } = req.body;

    // schema para validação
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    // Verificar se o schema é valido
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro de Validação' });
    }

    // Verificando se o usuario ja está cadastrado
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Usuario ja Registrado' });
    }

    // Criando Usuario
    const { id, name } = await User.create(req.body);

    return res.json({
      user: {
        id,
        name,
        email,
      },
    });
  }

  async update(req, res) {
    // Schema de Validação
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Erro de validação' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'Usuario ja existe' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Senha Invalida' });
    }

    await user.update(req.body);

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Senha Invalida' });
    }

    const { name } = await User.update(req.body, {
      where: {
        id: req.userId,
      },
    });

    return res.json({ user: { name, email } });
  }

  async destroy(req, res) {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.json({ Erro: 'Esse Usuario não Existe' });
    }

    user.destroy();

    return res.json({ Ok: 'Usuario apagado com Sucesso' });
  }
}

export default new UserController();
